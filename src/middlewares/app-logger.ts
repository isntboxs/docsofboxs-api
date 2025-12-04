import { pinoLogger } from 'hono-pino';

import { logger } from '@/lib/pino-logger';

export default function appLogger() {
  return pinoLogger({ pino: logger });
}
