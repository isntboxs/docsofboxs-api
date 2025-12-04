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
