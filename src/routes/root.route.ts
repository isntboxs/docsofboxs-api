import { factory } from '@/lib/factory';

const rootRoute = factory.createApp();

rootRoute.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Welcome to DocsOfBoxs API',
    version: '1.0.0',
    author: '@mrboxs',
  });
});

export default rootRoute;
