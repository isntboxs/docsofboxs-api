import createBlogHandler from '@/handlers/blogs/create-blog.handler';
import getAllBlogsHandler from '@/handlers/blogs/get-all-blogs.handler';

import { factory } from '@/lib/factory';

const blogsRoute = factory.createApp();

// get all blogs (public, with permission-based filtering)
blogsRoute.get('/', ...getAllBlogsHandler);

// create blog (private, required admin role)
blogsRoute.post('/', ...createBlogHandler);

export default blogsRoute;
