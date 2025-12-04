import { env } from '@/configs/env';

import * as HttpStatusCodes from '@/constants/http-status-codes';

import { getStatusPhrase } from '@/utils/get-status-phrases';

import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ErrorHandler } from 'hono';
import type { ApiErrorResponse } from '@/types/api-response';

const onError: ErrorHandler = (err, c) => {
  const currentStatus = 'status' in err ? err.status : c.newResponse(null).status;
  const statusCode =
    currentStatus !== HttpStatusCodes.OK
      ? (currentStatus as ContentfulStatusCode)
      : HttpStatusCodes.INTERNAL_SERVER_ERROR;

  return c.json<ApiErrorResponse>(
    {
      success: false,
      error: {
        code: getStatusPhrase(statusCode),
        message: err.message,
        stack: env.NODE_ENV === 'production' ? undefined : err.stack,
      },
    },
    statusCode
  );
};

export default onError;
