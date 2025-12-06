import createCommentBlogHandler from '@/handlers/comments/create-comment-blog.handler';
import createReplyHandler from '@/handlers/comments/create-reply.handler';

import { factory } from '@/lib/factory';

const commentsRoute = factory.createApp();

// Create a comment for a blog (private, requires authentication and roles: [user, admin])
commentsRoute.post('/blog/:blogId', ...createCommentBlogHandler);

// Create a reply to a comment (private, requires authentication and roles: [user, admin])
commentsRoute.post('/:commentId/reply', ...createReplyHandler);

export default commentsRoute;
