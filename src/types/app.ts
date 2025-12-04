import type { Logger } from 'pino';
import type { Env } from 'hono';
import type { PrismaClient } from '@/generated/prisma/client';
import type { Session } from '@/lib/auth';

export interface AppEnv extends Env {
  Variables: {
    logger: Logger;
    prisma: PrismaClient;
    session: Session['session'] | null;
    user: Session['user'] | null;
  };
}
