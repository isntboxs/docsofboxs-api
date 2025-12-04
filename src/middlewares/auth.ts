import { HTTPException } from 'hono/http-exception';

import * as HttpStatusCodes from '@/constants/http-status-codes';

import { factory } from '@/lib/factory';

import type { UserRole } from '@/generated/prisma/enums';

export const requireAuth = factory.createMiddleware(async (c, next) => {
  const user = c.get('user');

  if (!user) {
    throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
      message: 'You are unauthorized. Please login first',
    });
  }

  await next();
});

export const requireRole = (allowedRoles: UserRole | UserRole[]) => {
  return factory.createMiddleware(async (c, next) => {
    const user = c.get('user');

    if (!user) {
      throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
        message: 'User not found',
      });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const userRole =
      typeof user.role === 'string'
        ? user.role.split(',')
        : Array.isArray(user.role)
          ? user.role
          : ['user'];

    const hasRole = roles.some((role) => userRole.includes(role));

    if (!hasRole) {
      throw new HTTPException(HttpStatusCodes.FORBIDDEN, {
        message: 'Access denied, insufficient permissions',
      });
    }

    await next();
  });
};
