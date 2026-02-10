// src/modules/users/services/user-status.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Donor } from '../../donations/entities/donor.entity';
import { Beneficiary } from '../../beneficiaries/entities/beneficiary.entity';
import { UserType } from '../../../config/constants';

@Injectable()
export class UserStatusService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Donor)
    private donorsRepository: Repository<Donor>,
    @InjectRepository(Beneficiary)
    private beneficiariesRepository: Repository<Beneficiary>,
  ) {}

  async getUserStatus(userId: string): Promise<any> {
    const user = await this.getUserById(userId);
    const accountStatus = this.determineAccountStatus(user);
    const profileCompletion = await this.getProfileCompletion(userId, user.userType);

    return {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      isVerified: user.isVerified,
      isActive: user.isActive,
      verifiedAt: user.verifiedAt,
      lastLoginAt: user.lastLoginAt,
      accountStatus,
      profileCompletion,
      createdAt: user.createdAt,
    };
  }

  private async getUserById(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private determineAccountStatus(user: User): string {
    if (!user.isVerified) return 'UNVERIFIED';
    if (!user.isActive) return 'PENDING_ACTIVATION';
    return 'ACTIVE';
  }

  private async getProfileCompletion(userId: string, userType: UserType): Promise<any> {
    switch (userType) {
      case UserType.DONOR:
        return await this.getDonorProfileCompletion(userId);
      case UserType.BENEFICIARY:
        return await this.getBeneficiaryProfileCompletion(userId);
      default:
        return { percentage: 0, completedFields: [], missingFields: ['profile_type'] };
    }
  }

  private async getDonorProfileCompletion(userId: string): Promise<any> {
    const donor = await this.donorsRepository.findOne({ 
      where: { user: { id: userId } } 
    });
    
    return this.calculateDonorProfileCompletion(donor);
  }

  private async getBeneficiaryProfileCompletion(userId: string): Promise<any> {
    const beneficiary = await this.beneficiariesRepository.findOne({ 
      where: { user: { id: userId } } 
    });
    
    return this.calculateBeneficiaryProfileCompletion(beneficiary);
  }

  private calculateDonorProfileCompletion(donor: any): any {
    if (!donor) return { percentage: 0, missingFields: ['profile'] };
    
    const fields = [
      'fullName',
      'country',
      'preferredCurrency',
      'receiptPreference',
    ];
    
    const completed = fields.filter(field => donor[field]);
    const percentage = (completed.length / fields.length) * 100;
    
    return {
      percentage: Math.round(percentage),
      completedFields: completed,
      missingFields: fields.filter(field => !donor[field]),
    };
  }

  private calculateBeneficiaryProfileCompletion(beneficiary: any): any {
    if (!beneficiary) return { percentage: 0, missingFields: ['profile'] };
    
    const fields = [
      'fullName',
      'dateOfBirth',
      'location',
      'businessType',
      'startCapital',
      'trackingFrequency',
    ];
    
    const completed = fields.filter(field => beneficiary[field]);
    const percentage = (completed.length / fields.length) * 100;
    
    return {
      percentage: Math.round(percentage),
      completedFields: completed,
      missingFields: fields.filter(field => !beneficiary[field]),
    };
  }
}