import * as z from 'zod';

import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';

import * as HttpStatusCodes from '@/constants/http-status-codes';

import { auth } from '@/lib/auth';
import { factory } from '@/lib/factory';

import { requireAuth, requireRole } from '@/middlewares/auth';

import type { ApiSuccessResponse } from '@/types/api-response';

const deleteBlogByIdHandler = factory.createHandlers(
  requireAuth,
  requireRole(['admin']),
  zValidator('param', z.object({ blogId: z.uuid().nonempty({ error: 'Id is required' }) })),
  async (c) => {
    try {
      const { blogId } = c.req.valid('param');

      const user = c.get('user')!;
      const prisma = c.get('prisma');
      const logger = c.get('logger');

      const existingBlog = await prisma.blog.findUnique({
        where: { id: blogId },
      });

      if (!existingBlog) {
        throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
          message: 'Blog not found',
        });
      }

      const hasDeletePermission = await auth.api.userHasPermission({
        body: {
          userId: user.id,
          permission: {
            blogs: ['delete'],
          },
        },
      });

      if (!hasDeletePermission.success) {
        logger.warn(
          { userId: user.id, existingBlog },
          'A user tried to delete a blog without permissions'
        );

        throw new HTTPException(HttpStatusCodes.FORBIDDEN, {
          message: 'Access denied, insufficient permissions',
        });
      }

      await prisma.blog.delete({
        where: { id: blogId },
      });

      return c.json<ApiSuccessResponse>(
        {
          success: true,
          message: 'Blog deleted successfully',
        },
        HttpStatusCodes.OK
      );
    } catch (error) {
      const logger = c.get('logger');
      logger.error({ error }, 'Failed to delete blog');

      throw error;
    }
  }
);

export default deleteBlogByIdHandler;
