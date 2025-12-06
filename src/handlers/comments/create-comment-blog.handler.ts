import * as z from 'zod';

import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';

import * as HttpStatusCodes from '@/constants/http-status-codes';

import { factory } from '@/lib/factory';

import { requireAuth, requireRole } from '@/middlewares/auth';

import type { ApiSuccessResponse } from '@/types/api-response';
import type { Comment } from '@/types/comment';

const createCommentBlogHandler = factory.createHandlers(
  requireAuth,
  requireRole(['user', 'admin']),
  zValidator(
    'param',
    z.object({
      blogId: z.uuid().nonempty({ error: 'Blog ID is required' }),
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
    const { blogId } = c.req.valid('param');

    const user = c.get('user')!;
    const prisma = c.get('prisma');
    const logger = c.get('logger');

    try {
      const blog = await prisma.blog.findUnique({
        where: { id: blogId },
        select: { id: true, title: true },
      });

      if (!blog) {
        throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
          message: 'Blog not found',
        });
      }

      const newComment = await prisma.$transaction(async (tx) => {
        const comment = await tx.comment.create({
          data: {
            content,
            blogId,
            authorId: user.id,
          },
          include: {
            author: true,
          },
        });

        await tx.blog.update({
          where: { id: blogId },
          data: {
            commentsCount: {
              increment: 1,
            },
          },
        });

        return comment;
      });

      logger.info({ newComment }, 'Comment created successfully');

      const transformedComment: Comment = {
        id: newComment.id,
        authorId: newComment.authorId,
        blogId: newComment.blogId,
        content: newComment.content,
        author: {
          id: newComment.author.id,
          name: newComment.author.name,
          image: newComment.author.image,
          username: newComment.author.username,
        },
        createdAt: newComment.createdAt,
        updatedAt: newComment.updatedAt,
      };

      return c.json<ApiSuccessResponse<Comment>>(
        {
          success: true,
          message: 'Comment created successfully',
          data: transformedComment,
        },
        HttpStatusCodes.CREATED
      );
    } catch (error) {
      logger.error({ error }, 'Failed to create comment');
      throw error;
    }
  }
);

export default createCommentBlogHandler;
