import type { Logger } from 'pino';
import type { Env } from 'hono';

export interface AppEnv extends Env {
  Variables: {
    logger: Logger;
  };
}
