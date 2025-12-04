import createBlogHandler from '@/handlers/blogs/create-blog.handler';
import getAllBlogsHandler from '@/handlers/blogs/get-all-blogs.handler';
import getBlogBySlugHandler from '@/handlers/blogs/get-blog-by-slug.handler';
import getBlogsByUserHandler from '@/handlers/blogs/get-blogs-by-user.handler';

import { factory } from '@/lib/factory';

const blogsRoute = factory.createApp();

// get all blogs (public, with permission-based filtering)
blogsRoute.get('/', ...getAllBlogsHandler);

// get blogs by user (public, with permission-based filtering)
blogsRoute.get('/user/:userId', ...getBlogsByUserHandler);

// get blog by slug (public)
blogsRoute.get('/:slug', ...getBlogBySlugHandler);

// create blog (private, required admin role)
blogsRoute.post('/', ...createBlogHandler);

export default blogsRoute;
