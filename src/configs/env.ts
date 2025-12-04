import 'dotenv/config';

import { createEnv } from '@t3-oss/env-core';
import * as z from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    NODE_ENV: z.enum(['development', 'production', 'test']),
    PORT: z.coerce.number().int(),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']),
    CORS_ORIGINS: z.string().transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    ),
    ADMIN_EMAILS: z
      .string()
      .default('')
      .transform((val) =>
        val === '' ? [] : val.split(',').map((email) => email.trim().toLowerCase())
      ),
    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.url(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
