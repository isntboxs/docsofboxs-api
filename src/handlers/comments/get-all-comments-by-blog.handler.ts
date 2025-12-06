import * as z from 'zod';

import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';

import * as HttpStatusCodes from '@/constants/http-status-codes';

import { factory } from '@/lib/factory';

import { requireAuth, requireRole } from '@/middlewares/auth';

import { commentsPaginationSchema } from '@/schemas/pagination.schema';

import type { PaginatedResponse } from '@/types/api-response';
import type { Comment } from '@/types/comment';

const getCommentsBlogHandler = factory.createHandlers(
  requireAuth,
  requireRole(['user', 'admin']),
  zValidator(
    'param',
    z.object({
      blogId: z.uuid().nonempty({ error: 'Blog ID is required' }),
    })
  ),
  zValidator('query', commentsPaginationSchema),
  async (c) => {
    const { blogId } = c.req.valid('param');
    const { page, limit } = c.req.valid('query');
    const offset = (page - 1) * limit;

    const prisma = c.get('prisma');
    const logger = c.get('logger');

    try {
      const blog = await prisma.blog.findUnique({
        where: { id: blogId },
      });

      if (!blog) {
        throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
          message: 'Blog not found',
        });
      }

      const [totalCommentsCount, comments] = await Promise.all([
        prisma.comment.count({ where: { blogId, parentId: null } }),

        prisma.comment.findMany({
          where: { blogId, parentId: null },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
          include: {
            author: true,
            replies: {
              include: {
                author: true,
              },
            },
          },
        }),
      ]);

      const transformedComments: Comment[] = comments.map((comment) => ({
        id: comment.id,
        authorId: comment.authorId,
        blogId: comment.blogId,
        content: comment.content,
        parentId: comment.parentId,
        depth: comment.depth,
        author: {
          id: comment.author.id,
          name: comment.author.name,
          image: comment.author.image,
          username: comment.author.username,
        },
        replies: comment.replies
          ? comment.replies.map((reply) => ({
              id: reply.id,
              authorId: reply.authorId,
              blogId: reply.blogId,
              content: reply.content,
              parentId: reply.parentId,
              depth: reply.depth,
              author: {
                id: reply.author.id,
                name: reply.author.name,
                image: reply.author.image,
                username: reply.author.username,
              },
              createdAt: reply.createdAt,
              updatedAt: reply.updatedAt,
            }))
          : [],
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      }));

      return c.json<PaginatedResponse<Comment[]>>(
        {
          success: true,
          message: 'Comments retrieved successfully',
          data: transformedComments,
          pagination: {
            limit,
            page,
            offset,
            totalItems: totalCommentsCount,
            totalPages: Math.ceil(totalCommentsCount / limit),
          },
        },
        HttpStatusCodes.OK
      );
    } catch (error) {
      logger.error({ error }, 'Failed to get comments');
      throw error;
    }
  }
);

export default getCommentsBlogHandler;
