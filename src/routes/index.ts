import authRoute from '@/routes/auth.route';
import rootRoute from '@/routes/root.route';

import type { Hono } from 'hono';
import type { AppEnv } from '@/types/app';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerRoutes(app: Hono<AppEnv, any, any>) {
  const base = app.basePath('/api');

  base.route('/', rootRoute);
  base.route('/auth', authRoute);
}
