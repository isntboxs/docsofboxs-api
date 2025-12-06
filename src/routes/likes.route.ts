import likeBlogHandler from '@/handlers/likes/like-blog.handler';

import { factory } from '@/lib/factory';

const likesRoute = factory.createApp();

likesRoute.post('/blog/:blogId', ...likeBlogHandler);

export default likesRoute;
