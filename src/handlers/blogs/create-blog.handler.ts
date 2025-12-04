import { zValidator } from '@hono/zod-validator';

import * as HttpStatusCodes from '@/constants/http-status-codes';

import { factory } from '@/lib/factory';

import { requireAuth, requireRole } from '@/middlewares/auth';

import { createBlogSchema } from '@/schemas/blog.schema';

import { createUniqueSlug } from '@/utils/slug-helpers';

import type { ApiSuccessResponse } from '@/types/api-response';
import type { BlogType } from '@/types/blog';

const createBlogHandler = factory.createHandlers(
  requireAuth,
  requireRole(['admin']),
  zValidator('form', createBlogSchema),
  async (c) => {
    try {
      const { title, content, status } = c.req.valid('form');

      const user = c.get('user')!;
      const prisma = c.get('prisma');
      const logger = c.get('logger');

      // Generate unique slug from title
      const slug = await createUniqueSlug(title, async (slug) => {
        const existingBlog = await prisma.blog.findUnique({
          where: { slug },
        });

        return !!existingBlog;
      });

      // Create the blog with author relation
      const newBlog = await prisma.blog.create({
        data: {
          title,
          content,
          status,
          slug,
          authorId: user.id,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              username: true,
            },
          },
        },
      });

      logger.info({ newBlog }, 'Blog created successfully');

      // Transform to match BlogType interface
      const transformedBlog: BlogType = {
        id: newBlog.id,
        title: newBlog.title,
        slug: newBlog.slug,
        content: newBlog.content,
        status: newBlog.status,
        viewsCount: newBlog.viewsCount,
        likesCount: newBlog.likesCount,
        commentsCount: newBlog.commentsCount,
        author: {
          id: newBlog.author.id,
          name: newBlog.author.name,
          image: newBlog.author.image,
          username: newBlog.author.username,
        },
        createdAt: newBlog.createdAt,
        updatedAt: newBlog.updatedAt,
      };

      return c.json<ApiSuccessResponse<BlogType>>(
        {
          success: true,
          message: 'Blog created successfully',
          data: transformedBlog,
        },
        HttpStatusCodes.CREATED
      );
    } catch (error) {
      const logger = c.get('logger');
      logger.error({ error }, 'Failed to create blog');

      throw error;
    }
  }
);

export default createBlogHandler;
