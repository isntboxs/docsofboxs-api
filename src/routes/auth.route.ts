import { auth } from '@/lib/auth';
import { factory } from '@/lib/factory';

const authRoute = factory.createApp();

authRoute.on(['POST', 'GET'], '/*', (c) => {
  return auth.handler(c.req.raw);
});

export default authRoute;
