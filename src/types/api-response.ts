export type ApiSuccessResponse<T = void> = {
  success: true;
  message: string;
} & (T extends void ? object : { data: T });

export type PaginatedResponse<T> = {
  data: T;
  pagination: {
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
    totalItems: number;
  };
} & Omit<ApiSuccessResponse, 'data'>;

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
