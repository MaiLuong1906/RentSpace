export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  page?: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
  size?: number;
}

export interface ApiError {
  success: false;
  message: string;
  data?: Record<string, string>; // Validation errors
  timestamp: string;
}
