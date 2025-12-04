export type ApiSuccessResponse<T = void> = {
  success: true;
  message: string;
} & (T extends void ? object : { data: T });

export interface ApiErrorResponse {
  success: boolean;
  error?: ApiErrorDetail;
}

interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}
