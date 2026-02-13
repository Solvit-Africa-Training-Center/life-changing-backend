// src/common/decorators/current-donor.decorator.ts
import { createParamDecorator, ExecutionContext, NotFoundException } from '@nestjs/common';
import { Donor } from '../../modules/donations/entities/donor.entity';
import { UserType } from '../../config/constants';

export const CurrentDonor = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<Donor> => {
    const request = ctx.switchToHttp().getRequest();
    
    // Get the service from the request (attached by interceptor)
    const donorsService = request.donorsService;
    
    if (!donorsService) {
      console.error('DonorsService not attached to request. Make sure DonorServiceInterceptor is applied.');
      throw new NotFoundException('Donors service not available');
    }

    if (!request.user) {
      throw new NotFoundException('User not authenticated');
    }

    console.log('User authenticated:', request.user.userType, request.user.id);

    // Handle DONOR user type
    if (request.user.userType === UserType.DONOR) {
      const donor = await donorsService.findDonorByUserId(request.user.id);
      
      if (!donor) {
        throw new NotFoundException('Donor profile not found. Please complete your donor profile first.');
      }
      
      return donor;
    }
    
    // Handle ADMIN user type
    if (request.user.userType === UserType.ADMIN) {
      const donorId = request.query.donorId || request.body.donorId;
      
       if (!donorId) {
        throw new NotFoundException('Donor ID is required for admin users');
      }
      
      const donor = await donorsService.findDonorById(donorId);
      
      if (!donor) {
        throw new NotFoundException(`Donor with ID ${donorId} not found`);
      }
      
      return donor;
    }
    throw new NotFoundException(`User type '${request.user.userType}' not supported for donor operations`);
  },
);