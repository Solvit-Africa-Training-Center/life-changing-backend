import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: Date;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((response) => {
    
        if (response?.data !== undefined) {
          return {
            success: true,
            message: response.message,
            data: response.data,
            timestamp: new Date(),
          };
        }

        // Default wrapping
        return {
          success: true,
          data: response,
          timestamp: new Date(),
        };
      }),
    );
  }
}