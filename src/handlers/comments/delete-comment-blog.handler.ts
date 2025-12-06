import * as z from 'zod';

import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';

import * as HttpStatusCodes from '@/constants/http-status-codes';

import { factory } from '@/lib/factory';

import { requireAuth, requireRole } from '@/middlewares/auth';

import type { ApiSuccessResponse } from '@/types/api-response';

const deleteCommentBlogHandler = factory.createHandlers(
  requireAuth,
  requireRole(['user', 'admin']),
  zValidator(
    'param',
    z.object({
      commentId: z.uuid().nonempty({ error: 'Comment ID is required' }),
    })
  ),
  async (c) => {
    const { commentId } = c.req.valid('param');

    const user = c.get('user')!;
    const prisma = c.get('prisma');
    const logger = c.get('logger');

    try {
      await prisma.$transaction(async (tx) => {
        const comment = await tx.comment.findUnique({
          where: { id: commentId },
          select: { id: true, authorId: true, blogId: true, parentId: true },
        });

        if (!comment) {
          throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
            message: 'Comment not found',
          });
        }

        // Check if the user is the author of the comment or an admin
        if (comment.authorId !== user.id && user.role !== 'admin') {
          throw new HTTPException(HttpStatusCodes.FORBIDDEN, {
            message: 'You are not authorized to delete this comment',
          });
        }

        // Count the comment and all its nested replies for decrementing blog comment count
        const repliesCount = await tx.comment.count({
          where: {
            OR: [{ id: commentId }, { parentId: commentId }],
          },
        });

        // Delete the comment (cascades to replies due to onDelete: Cascade)
        await tx.comment.delete({
          where: { id: commentId },
        });

        // Decrement the blog's comment count
        await tx.blog.update({
          where: { id: comment.blogId },
          data: {
            commentsCount: {
              decrement: repliesCount,
            },
          },
        });

        logger.info(
          { commentId, blogId: comment.blogId, authorId: comment.authorId },
          'Comment deleted successfully'
        );
      });

      return c.json<ApiSuccessResponse>(
        {
          success: true,
          message: 'Comment deleted successfully',
        },
        HttpStatusCodes.OK
      );
    } catch (error) {
      logger.error({ error }, 'Failed to delete comment');
      throw error;
    }
  }
);

export default deleteCommentBlogHandler;
