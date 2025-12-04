import * as z from 'zod';

const blogStatusSchema = z.enum(['draft', 'published']);

export const createBlogSchema = z.object({
  title: z
    .string()
    .nonempty({ error: 'Title is required' })
    .max(180, { error: 'Title must be less than 180 characters' }),
  content: z.string().nonempty({ error: 'Content is required' }),
  status: blogStatusSchema.default('draft'),
});
