// src/common/decorators/current-beneficiary.decorator.ts
import { createParamDecorator, ExecutionContext, NotFoundException } from '@nestjs/common';
import { Beneficiary } from '../../modules/beneficiaries/entities/beneficiary.entity';
import { UserType } from '../../config/constants';

export const CurrentBeneficiary = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<Beneficiary> => {
    const request = ctx.switchToHttp().getRequest();
    const beneficiariesService = request.app.get('BeneficiariesService');
    
    if (request.user.userType === UserType.BENEFICIARY) {
      const beneficiary = await beneficiariesService.findBeneficiaryByUserId(request.user.id);
      
      if (!beneficiary) {
        throw new NotFoundException('Beneficiary profile not found');
      }
      
      return beneficiary;
    }
    
    if (request.user.userType === UserType.ADMIN) {
      const beneficiaryId = request.query.beneficiaryId || request.body.beneficiaryId;
      
      if (!beneficiaryId) {
        throw new NotFoundException('Beneficiary ID is required for admin users');
      }
      
      const beneficiary = await beneficiariesService.findOne(beneficiaryId);
      
      if (!beneficiary) {
        throw new NotFoundException('Beneficiary not found');
      }
      
      return beneficiary;
    }
    
    throw new NotFoundException('User type not supported');
  },
);