import * as z from 'zod';

import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';

import * as HttpStatusCodes from '@/constants/http-status-codes';

import { factory } from '@/lib/factory';

import { requireAuth, requireRole } from '@/middlewares/auth';

import type { ApiSuccessResponse } from '@/types/api-response';

const unlikeBlogHandler = factory.createHandlers(
  requireAuth,
  requireRole(['user', 'admin']),
  zValidator(
    'param',
    z.object({
      blogId: z.uuid().nonempty({ error: 'Blog ID is required' }),
    })
  ),
  async (c) => {
    const { blogId } = c.req.valid('param');

    const user = c.get('user')!;
    const prisma = c.get('prisma');
    const logger = c.get('logger');

    try {
      // Step 1: Verify blog exists
      const blog = await prisma.blog.findUnique({
        where: { id: blogId },
        select: { id: true, title: true },
      });

      if (!blog) {
        throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
          message: 'Blog not found',
        });
      }

      // Step 2: Check if user already liked this blog
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_blogId: {
            userId: user.id,
            blogId,
          },
        },
      });

      if (!existingLike) {
        throw new HTTPException(HttpStatusCodes.CONFLICT, {
          message: 'You have not liked this blog',
        });
      }

      // Step 3: Use transaction to atomically create like and increment likesCount
      const [unlike, updatedBlog] = await prisma.$transaction([
        // Create the like record
        prisma.like.delete({
          where: {
            userId_blogId: {
              userId: user.id,
              blogId,
            },
          },
          include: {
            blog: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        }),

        // Increment the likesCount on the blog
        prisma.blog.update({
          where: { id: blogId },
          data: {
            likesCount: {
              decrement: 1,
            },
          },
          select: {
            id: true,
            likesCount: true,
          },
        }),
      ]);

      logger.info({ unlikeId: unlike.id, blogId, userId: user.id }, 'Blog unliked successfully');

      return c.json<ApiSuccessResponse<{ likeCount: number }>>(
        {
          success: true,
          message: 'Blog unliked successfully',
          data: {
            likeCount: updatedBlog.likesCount,
          },
        },
        HttpStatusCodes.OK
      );
    } catch (error) {
      logger.error({ error, blogId, userId: user.id }, 'Failed to unlike blog');
      throw error;
    }
  }
);

export default unlikeBlogHandler;
