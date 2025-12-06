import createCommentBlogHandler from '@/handlers/comments/create-comment-blog.handler';

import { factory } from '@/lib/factory';

const commentsRoute = factory.createApp();

// Create a comment for a blog (private, requires authentication and roles: [user, admin])
commentsRoute.post('/blog/:blogId', ...createCommentBlogHandler);

export default commentsRoute;
