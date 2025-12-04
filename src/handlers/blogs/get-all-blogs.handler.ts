import * as z from 'zod';

import { zValidator } from '@hono/zod-validator';

import * as HttpStatusCodes from '@/constants/http-status-codes';

import { auth } from '@/lib/auth';
import { factory } from '@/lib/factory';

import type { BlogStatus } from '@/generated/prisma/enums';
import type { ApiSuccessResponse } from '@/types/api-response';
import type { BlogType } from '@/types/blog';

// Query params schema for pagination
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export interface PaginatedBlogsResponse {
  blogs: BlogType[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const getAllBlogsHandler = factory.createHandlers(
  zValidator('query', paginationSchema),
  async (c) => {
    try {
      const { page, limit } = c.req.valid('query');

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
      const statusFilter: BlogStatus[] = canReadDraft
        ? ['published', 'draft'] // Admin can see both
        : ['published']; // Regular users/unauthenticated only see published

      logger.info(
        { userId: user?.id, canReadDraft, statusFilter },
        'Fetching blogs with permission-based filtering'
      );

      // Calculate pagination offset
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const totalCount = await prisma.blog.count({
        where: {
          status: {
            in: statusFilter,
          },
        },
      });

      // Fetch paginated blogs
      const blogs = await prisma.blog.findMany({
        where: {
          status: {
            in: statusFilter,
          },
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
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      });

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

      const totalPages = Math.ceil(totalCount / limit);

      const response: PaginatedBlogsResponse = {
        blogs: transformedBlogs,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };

      return c.json<ApiSuccessResponse<PaginatedBlogsResponse>>(
        {
          success: true,
          message: 'Blogs fetched successfully',
          data: response,
        },
        HttpStatusCodes.OK
      );
    } catch (error) {
      const logger = c.get('logger');
      logger.error({ error }, 'Failed to fetch blogs');

      throw error;
    }
  }
);

export default getAllBlogsHandler;
