import * as z from 'zod';

import {
  MAX_DEFAULT_LIMIT,
  MAX_DEFAULT_PAGE,
  MIN_DEFAULT_LIMIT,
  MIN_DEFAULT_PAGE,
} from '@/constants';

export const blogsPaginationSchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .positive()
    .min(MIN_DEFAULT_LIMIT)
    .max(MAX_DEFAULT_LIMIT)
    .default(MIN_DEFAULT_LIMIT),
  page: z.coerce
    .number()
    .int()
    .positive()
    .min(MIN_DEFAULT_PAGE)
    .max(MAX_DEFAULT_PAGE)
    .default(MIN_DEFAULT_PAGE),
});
