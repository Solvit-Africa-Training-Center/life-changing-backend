// src/common/interceptors/beneficiary-service.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Observable } from 'rxjs';
import { BeneficiariesService } from '../../modules/beneficiaries/services/beneficiaries.service';

@Injectable()
export class BeneficiaryServiceInterceptor implements NestInterceptor {
  constructor(private moduleRef: ModuleRef) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Get the service from ModuleRef and attach to request
    request.beneficiariesService = this.moduleRef.get(BeneficiariesService, { strict: false });
    
    return next.handle();
  }
}