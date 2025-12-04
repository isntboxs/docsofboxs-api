import { format } from 'date-fns';
import pino from 'pino';
import pretty from 'pino-pretty';

import { env } from '@/configs/env';

export const logger = pino(
  {
    level: env.LOG_LEVEL,
    timestamp: () => `,"time":"${format(new Date(), 'HH:mm:ss')}"`,
  },
  pretty()
);
