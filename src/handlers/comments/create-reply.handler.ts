import * as z from 'zod';

import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';

import * as HttpStatusCodes from '@/constants/http-status-codes';

import { factory } from '@/lib/factory';

import { requireAuth, requireRole } from '@/middlewares/auth';

import type { ApiSuccessResponse } from '@/types/api-response';
import type { Comment } from '@/types/comment';

const MAX_DEPTH = 5; // Maximum nesting depth allowed

const createReplyHandler = factory.createHandlers(
  requireAuth,
  requireRole(['user', 'admin']),
  zValidator(
    'param',
    z.object({
      commentId: z.uuid().nonempty({ error: 'Comment ID is required' }),
    })
  ),
  zValidator(
    'form',
    z.object({
      content: z.string().nonempty({ error: 'Content is required' }),
    })
  ),
  async (c) => {
    const { content } = c.req.valid('form');
    const { commentId } = c.req.valid('param');

    const user = c.get('user')!;
    const prisma = c.get('prisma');
    const logger = c.get('logger');

    try {
      // Fetch the parent comment to get its depth and blogId
      const parentComment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { id: true, depth: true, blogId: true },
      });

      if (!parentComment) {
        throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
          message: 'Parent comment not found',
        });
      }

      // Check if max depth is exceeded
      if (parentComment.depth >= MAX_DEPTH) {
        throw new HTTPException(HttpStatusCodes.BAD_REQUEST, {
          message: `Comments cannot be nested more than ${MAX_DEPTH} levels deep`,
        });
      }

      const newReply = await prisma.$transaction(async (tx) => {
        const reply = await tx.comment.create({
          data: {
            content,
            blogId: parentComment.blogId,
            authorId: user.id,
            parentId: commentId,
            depth: parentComment.depth + 1,
          },
          include: {
            author: true,
          },
        });

        await tx.blog.update({
          where: { id: parentComment.blogId },
          data: {
            commentsCount: {
              increment: 1,
            },
          },
        });

        return reply;
      });

      logger.info({ newReply }, 'Reply created successfully');

      const transformedComment: Comment = {
        id: newReply.id,
        authorId: newReply.authorId,
        blogId: newReply.blogId,
        content: newReply.content,
        parentId: newReply.parentId,
        depth: newReply.depth,
        author: {
          id: newReply.author.id,
          name: newReply.author.name,
          image: newReply.author.image,
          username: newReply.author.username,
        },
        createdAt: newReply.createdAt,
        updatedAt: newReply.updatedAt,
      };

      return c.json<ApiSuccessResponse<Comment>>(
        {
          success: true,
          message: 'Reply created successfully',
          data: transformedComment,
        },
        HttpStatusCodes.CREATED
      );
    } catch (error) {
      logger.error({ error }, 'Failed to create reply');
      throw error;
    }
  }
);

export default createReplyHandler;
