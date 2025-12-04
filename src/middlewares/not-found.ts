import * as HttpStatusCodes from '@/constants/http-status-codes';
import * as HttpStatusPhrases from '@/constants/http-status-phrases';

import type { NotFoundHandler } from 'hono';
import type { ApiErrorResponse } from '@/types/api-response';

const notFound: NotFoundHandler = (c) => {
  return c.json<ApiErrorResponse>(
    {
      success: false,
      error: {
        code: HttpStatusPhrases.NOT_FOUND,
        message: `${HttpStatusPhrases.NOT_FOUND} - ${c.req.path}`,
      },
    },
    HttpStatusCodes.NOT_FOUND
  );
};

export default notFound;
