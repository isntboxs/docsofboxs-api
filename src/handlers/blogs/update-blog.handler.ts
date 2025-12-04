import * as z from 'zod';

import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';

import * as HttpStatusCodes from '@/constants/http-status-codes';

import { factory } from '@/lib/factory';

import { requireAuth, requireRole } from '@/middlewares/auth';

import { updateBlogSchema } from '@/schemas/blog.schema';

import { createUniqueSlug } from '@/utils/slug-helpers';

import type { ApiSuccessResponse } from '@/types/api-response';
import type { BlogType } from '@/types/blog';

const updateBlogHandler = factory.createHandlers(
  requireAuth,
  requireRole(['admin']),
  zValidator('param', z.object({ slug: z.string().nonempty({ error: 'Slug is required' }) })),
  zValidator('form', updateBlogSchema),
  async (c) => {
    try {
      const { title, content, status } = c.req.valid('form');
      const { slug } = c.req.valid('param');

      const user = c.get('user')!;
      const prisma = c.get('prisma');
      const logger = c.get('logger');

      const existingBlog = await prisma.blog.findUnique({
        where: { slug },
        include: {
          author: true,
        },
      });

      if (!existingBlog) {
        throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
          message: 'Blog not found',
        });
      }

      if (existingBlog.authorId !== user.id) {
        logger.warn(
          { userId: user.id, existingBlog },
          'A user tried to update a blog without permissions'
        );
        throw new HTTPException(HttpStatusCodes.FORBIDDEN, {
          message: 'Access denied, insufficient permissions',
        });
      }

      let updateSlug = existingBlog.slug;
      if (title && title !== existingBlog.title) {
        updateSlug = await createUniqueSlug(title, async (newSlug) => {
          const duplicateSlug = await prisma.blog.findFirst({
            where: { slug: newSlug },
          });

          return !!duplicateSlug;
        });
      }

      if (title) existingBlog.title = title;
      if (content) existingBlog.content = content;
      if (status) existingBlog.status = status;

      const updatedBlog = await prisma.blog.update({
        where: { slug },
        data: {
          title: existingBlog.title,
          content: existingBlog.content,
          status: existingBlog.status,
          slug: updateSlug,
        },
        include: {
          author: true,
        },
      });

      logger.info({ updatedBlog }, 'Blog updated successfully');

      // Transform to match BlogType interface
      const transformedBlog: BlogType = {
        id: updatedBlog.id,
        title: updatedBlog.title,
        slug: updatedBlog.slug,
        content: updatedBlog.content,
        status: updatedBlog.status,
        viewsCount: updatedBlog.viewsCount,
        likesCount: updatedBlog.likesCount,
        commentsCount: updatedBlog.commentsCount,
        author: {
          id: updatedBlog.author.id,
          name: updatedBlog.author.name,
          image: updatedBlog.author.image,
          username: updatedBlog.author.username,
        },
        createdAt: updatedBlog.createdAt,
        updatedAt: updatedBlog.updatedAt,
      };

      return c.json<ApiSuccessResponse<BlogType>>(
        {
          success: true,
          message: 'Blog updated successfully',
          data: transformedBlog,
        },
        HttpStatusCodes.OK
      );
    } catch (error) {
      const logger = c.get('logger');
      logger.error({ error }, 'Failed to update blog');

      throw error;
    }
  }
);

export default updateBlogHandler;
