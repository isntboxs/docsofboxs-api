import type { Logger } from 'pino';
import type { Env } from 'hono';
import type { PrismaClient } from '@/generated/prisma/client';

export interface AppEnv extends Env {
  Variables: {
    logger: Logger;
    prisma: PrismaClient;
  };
}
