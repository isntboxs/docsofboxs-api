import { createFactory } from 'hono/factory';

import { logger } from '@/lib/pino-logger';
import { prisma } from '@/lib/prisma';

import type { AppEnv } from '@/types/app';

export const factory = createFactory<AppEnv>({
  defaultAppOptions: {
    strict: false,
  },

  initApp: (app) => {
    app.use(async (c, next) => {
      c.set('logger', logger);
      await next();
    });

    app.use(async (c, next) => {
      c.set('prisma', prisma);
      await next();
    });
  },
});
