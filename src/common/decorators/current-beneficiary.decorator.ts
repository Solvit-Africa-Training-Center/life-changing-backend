// src/common/decorators/current-beneficiary.decorator.ts
import { createParamDecorator, ExecutionContext, NotFoundException } from '@nestjs/common';
import { Beneficiary } from '../../modules/beneficiaries/entities/beneficiary.entity';
import { UserType } from '../../config/constants';

export const CurrentBeneficiary = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<Beneficiary> => {
    const request = ctx.switchToHttp().getRequest();
    
    // Get the service from the request (attached by interceptor)
    const beneficiariesService = request.beneficiariesService;
    
    if (!beneficiariesService) {
      console.error('BeneficiariesService not attached to request. Make sure BeneficiaryServiceInterceptor is applied.');
      throw new NotFoundException('Beneficiaries service not available');
    }

    if (!request.user) {
      throw new NotFoundException('User not authenticated');
    }

    // Handle BENEFICIARY user type
    if (request.user.userType === UserType.BENEFICIARY) {
      const beneficiary = await beneficiariesService.findBeneficiaryByUserId(request.user.id);
      
      if (!beneficiary) {
        throw new NotFoundException('Beneficiary profile not found for this user');
      }
      
      return beneficiary;
    }
    
    // Handle ADMIN user type
    if (request.user.userType === UserType.ADMIN) {
      const beneficiaryId = request.query.beneficiaryId || request.body.beneficiaryId;
      
      if (!beneficiaryId) {
        throw new NotFoundException('Beneficiary ID is required for admin users');
      }
      
      const beneficiary = await beneficiariesService.findBeneficiaryById(beneficiaryId);
      
      if (!beneficiary) {
        throw new NotFoundException(`Beneficiary with ID ${beneficiaryId} not found`);
      }
      
      return beneficiary;
    }
    
    throw new NotFoundException(`User type '${request.user.userType}' not supported`);
  },
);