// src/common/decorators/current-donor.decorator.ts
import { createParamDecorator, ExecutionContext, NotFoundException } from '@nestjs/common';
import { Donor } from '../../modules/donations/entities/donor.entity';
import { UserType } from '../../config/constants';

export const CurrentDonor = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<Donor> => {
    const request = ctx.switchToHttp().getRequest();
    const donorsService = request.app.get('DonorsService');
    
    if (request.user.userType === UserType.DONOR) {
      const donor = await donorsService.findDonorByUserId(request.user.id);
      
      if (!donor) {
        throw new NotFoundException('Donor profile not found');
      }
      
      return donor;
    }
    
    if (request.user.userType === UserType.ADMIN) {
      const donorId = request.query.donorId || request.body.donorId;
      
      if (!donorId) {
        throw new NotFoundException('Donor ID is required for admin users');
      }
      
      const donor = await donorsService.findOne(donorId);
      
      if (!donor) {
        throw new NotFoundException('Donor not found');
      }
      
      return donor;
    }
    
    throw new NotFoundException('User type not supported');
  },
);