export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code?: string; message?: string; details?: unknown };
  meta?: { page?: number; limit?: number; total?: number; timestamp?: string };
}
