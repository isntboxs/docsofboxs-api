import * as z from 'zod';

import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';

import * as HttpStatusCodes from '@/constants/http-status-codes';

import { factory } from '@/lib/factory';

import { requireAuth, requireRole } from '@/middlewares/auth';

import { BlogStatus, UserRole } from '@/generated/prisma/enums';

import type { ApiSuccessResponse } from '@/types/api-response';
import type { BlogType } from '@/types/blog';

const getBlogBySlugHandler = factory.createHandlers(
  requireAuth,
  requireRole(['user', 'admin']),
  zValidator('param', z.object({ slug: z.string().nonempty({ error: 'Slug is required' }) })),
  async (c) => {
    try {
      const { slug } = c.req.valid('param');

      const user = c.get('user');
      const prisma = c.get('prisma');
      const logger = c.get('logger');

      const blog = await prisma.blog.findUnique({
        where: { slug },
        include: {
          author: true,
        },
      });

      if (!blog) {
        throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
          message: 'Blog not found',
        });
      }

      if (
        user?.role === UserRole.user &&
        blog.status === BlogStatus.draft &&
        blog.author.id !== user.id
      ) {
        logger.warn({ userId: user.id, blog }, 'User tried to access a draft blog');

        throw new HTTPException(HttpStatusCodes.FORBIDDEN, {
          message: 'Access denied, insufficient permissions',
        });
      }

      // Transform to match BlogType interface
      const transformedBlog: BlogType = {
        id: blog.id,
        title: blog.title,
        slug: blog.slug,
        content: blog.content,
        status: blog.status,
        viewsCount: blog.viewsCount,
        likesCount: blog.likesCount,
        commentsCount: blog.commentsCount,
        author: {
          id: blog.author.id,
          name: blog.author.name,
          image: blog.author.image,
          username: blog.author.username,
        },
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
      };

      logger.info({ blog }, 'Blog fetched successfully');

      return c.json<ApiSuccessResponse<BlogType>>(
        {
          success: true,
          message: 'Blog fetched successfully',
          data: transformedBlog,
        },
        HttpStatusCodes.OK
      );
    } catch (error) {
      const logger = c.get('logger');
      logger.error({ error }, 'Failed to fetch blog by slug');

      throw error;
    }
  }
);

export default getBlogBySlugHandler;
