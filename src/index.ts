import { serve } from '@hono/node-server';

import { env } from '@/configs/env';

import app from '@/app';

const port = env.PORT;

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
