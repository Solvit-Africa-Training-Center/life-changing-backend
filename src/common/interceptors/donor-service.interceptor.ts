// src/common/interceptors/donor-service.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Observable } from 'rxjs';
import { DonorsService } from '../../modules/donations/services/donors.service';

@Injectable()
export class DonorServiceInterceptor implements NestInterceptor {
  constructor(private moduleRef: ModuleRef) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    request.donorsService = this.moduleRef.get(DonorsService, { strict: false });
    
    return next.handle();
  }
}