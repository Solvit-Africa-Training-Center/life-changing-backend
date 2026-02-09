import {ExceptionFilter,Catch,ArgumentsHost,HttpException,HttpStatus} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException) 
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = 'An error occurred';
    let errors: any = null;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      message =
        (exceptionResponse as any).message ||
        HttpStatus[status];
      errors = (exceptionResponse as any).errors || null;
    }

    response.status(status).json({
      statusCode: status,
      error: HttpStatus[status],
      message,
      errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
