import createApp from '@/lib/create-app';

import { registerRoutes } from '@/routes';

const app = createApp();

// Register all routes
registerRoutes(app);

// Root endpoint (redirect to /api)
app.get('/', (c) => {
  return c.redirect('/api');
});

export default app;
