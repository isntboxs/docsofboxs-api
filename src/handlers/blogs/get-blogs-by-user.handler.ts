import * as z from 'zod';

import { zValidator } from '@hono/zod-validator';

import * as HttpStatusCodes from '@/constants/http-status-codes';

import { auth } from '@/lib/auth';
import { factory } from '@/lib/factory';

import { blogsPaginationSchema } from '@/schemas/pagination.schema';

import { BlogStatus } from '@/generated/prisma/enums';

import type { Prisma } from '@/generated/prisma/client';
import type { PaginatedResponse } from '@/types/api-response';
import type { BlogType } from '@/types/blog';

const getBlogsByUserHandler = factory.createHandlers(
  zValidator('param', z.object({ userId: z.uuid().nonempty({ error: 'User ID is required' }) })),
  zValidator('query', blogsPaginationSchema),
  async (c) => {
    try {
      const { userId } = c.req.valid('param');

      const { page, limit } = c.req.valid('query');
      const offset = (page - 1) * limit;

      const user = c.get('user');
      const prisma = c.get('prisma');
      const logger = c.get('logger');

      // Check if user has permission to read drafts
      let canReadDraft = false;

      if (user) {
        const hasPermission = await auth.api.userHasPermission({
          body: {
            userId: user.id,
            permission: {
              blogs: ['read:draft'],
            },
          },
        });

        canReadDraft = hasPermission?.success ?? false;
      }

      // Build status filter based on permissions
      const whereClause: Prisma.BlogWhereInput = {
        status: {
          in: canReadDraft ? [BlogStatus.published, BlogStatus.draft] : [BlogStatus.published],
        },
        authorId: userId,
      };

      logger.info(
        { userId: user?.id, canReadDraft, whereClause, authorId: userId },
        'Fetching blogs with permission-based filtering by user'
      );

      const [totalCount, blogs] = await Promise.all([
        prisma.blog.count({ where: whereClause }),

        prisma.blog.findMany({
          where: whereClause,
          include: {
            author: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip: offset,
          take: limit,
        }),
      ]);

      // Transform to match BlogType interface
      const transformedBlogs: BlogType[] = blogs.map((blog) => ({
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
      }));

      return c.json<PaginatedResponse<BlogType[]>>(
        {
          success: true,
          message: 'Blogs by user fetched successfully',
          data: transformedBlogs,
          pagination: {
            limit,
            offset,
            page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
          },
        },
        HttpStatusCodes.OK
      );
    } catch (error) {
      const logger = c.get('logger');
      logger.error({ error }, 'Failed to fetch blogs by user');

      throw error;
    }
  }
);

export default getBlogsByUserHandler;
