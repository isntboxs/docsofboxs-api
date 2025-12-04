import createBlogHandler from '@/handlers/blogs/create-blog.handler';

import { factory } from '@/lib/factory';

const blogsRoute = factory.createApp();

// create blog (private, required admin role)
blogsRoute.post('/', ...createBlogHandler);

export default blogsRoute;
