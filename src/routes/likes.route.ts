import likeBlogHandler from '@/handlers/likes/like-blog.handler';
import unlikeBlogHandler from '@/handlers/likes/unlike-blog.handler';

import { factory } from '@/lib/factory';

const likesRoute = factory.createApp();

// Like a blog (private, requires authentication and roles: [user, admin])
likesRoute.post('/blog/:blogId', ...likeBlogHandler);

// Unlike a blog (private, requires authentication and roles: [user, admin])
likesRoute.delete('/blog/:blogId', ...unlikeBlogHandler);

export default likesRoute;
