import createCommentBlogHandler from '@/handlers/comments/create-comment-blog.handler';
import createReplyHandler from '@/handlers/comments/create-reply.handler';
import deleteCommentBlogHandler from '@/handlers/comments/delete-comment-blog.handler';
import getCommentsBlogHandler from '@/handlers/comments/get-all-comments-by-blog.handler';
import getRepliesCommentHandler from '@/handlers/comments/get-replies-comment.handler';

import { factory } from '@/lib/factory';

const commentsRoute = factory.createApp();

// Get comments for a blog (private, requires authentication and roles: [user, admin])
commentsRoute.get('/blog/:blogId', ...getCommentsBlogHandler);

// Get replies for a comment (private, requires authentication and roles: [user, admin])
commentsRoute.get('/:commentId/replies', ...getRepliesCommentHandler);

// Create a comment for a blog (private, requires authentication and roles: [user, admin])
commentsRoute.post('/blog/:blogId', ...createCommentBlogHandler);

// Create a reply to a comment (private, requires authentication and roles: [user, admin])
commentsRoute.post('/:commentId/reply', ...createReplyHandler);

// Delete a comment (private, requires authentication and roles: [user, admin])
commentsRoute.delete('/:commentId', ...deleteCommentBlogHandler);

export default commentsRoute;
