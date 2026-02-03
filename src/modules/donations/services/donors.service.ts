// src/modules/donations/services/donors.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Donor } from '../entities/donor.entity';
import { User } from '../../users/entities/user.entity';
import { BaseService } from '../../../shared/services/base.service';
import { PaginationParams, PaginatedResponse } from '../../../shared/interfaces/pagination.interface';
import { CreateDonorDto } from '../dto/create-donor.dto';
import { UpdateDonorDto } from '../dto/update-donor.dto';
import { UserType } from '../../../config/constants';
import { DonorStatsDto } from '../dto/donor-stats.dto';

@Injectable()
export class DonorsService extends BaseService<Donor> {
  constructor(
    @InjectRepository(Donor)
    private donorsRepository: Repository<Donor>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    super(donorsRepository);
  }

  async createDonor(userId: string, createDonorDto: CreateDonorDto): Promise<Donor> {
    // Check if user exists
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has a donor profile
    const existingDonor = await this.donorsRepository.findOne({
      where: { user: { id: userId } },
    });

    if (existingDonor) {
      throw new ConflictException('User already has a donor profile');
    }

    // Update user type
    user.userType = UserType.DONOR;
    await this.usersRepository.save(user);

    // Create donor profile
    const donor = this.donorsRepository.create({
      user,
      ...createDonorDto,
    });

    return await this.donorsRepository.save(donor);
  }

  async findDonorByUserId(userId: string): Promise<Donor | null> {
    return this.donorsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'donations', 'recurringDonations'],
    });
  }

  async updateDonor(donorId: string, updateDonorDto: UpdateDonorDto): Promise<Donor> {
    const donor = await this.findOne(donorId, ['user']);
    
    if (!donor) {
      throw new NotFoundException('Donor not found');
    }

    Object.assign(donor, updateDonorDto);
    return await this.donorsRepository.save(donor);
  }

  async updateDonorTotal(donorId: string, amount: number): Promise<void> {
    await this.donorsRepository.update(donorId, {
      totalDonated: () => `total_donated + ${amount}`,
      lastDonationDate: new Date(),
    });
  }

  async getDonorsByCountry(country: string, paginationParams: PaginationParams): Promise<PaginatedResponse<Donor>> {
    const where: FindOptionsWhere<Donor> = { country };
    return this.paginate(paginationParams, where, ['user']);
  }

  async getTopDonors(limit: number = 10): Promise<Donor[]> {
    return this.donorsRepository.find({
      where: { anonymityPreference: false },
      order: { totalDonated: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }

  async searchDonors(query: string, paginationParams: PaginationParams): Promise<PaginatedResponse<Donor>> {
    const where: FindOptionsWhere<Donor>[] = [
      { fullName: query },
      { country: query },
    ];

    return this.paginate(paginationParams, where.length > 0 ? where : undefined, ['user']);
  }

  async getDonorStats(): Promise<DonorStatsDto> {
    const totalDonors = await this.count();
    const totalDonatedResult = await this.donorsRepository
      .createQueryBuilder('donor')
      .select('SUM(donor.totalDonated)', 'total')
      .getRawOne();

    const recurringDonors = await this.count({ isRecurringDonor: true });
    const byCountry = await this.donorsRepository
      .createQueryBuilder('donor')
      .select('donor.country, COUNT(*) as count, SUM(donor.totalDonated) as total')
      .groupBy('donor.country')
      .getRawMany();

    return {
      totalDonors,
      totalDonated: parseFloat(totalDonatedResult?.total || '0') || 0,
      recurringDonors,
      byCountry,
    };
  }
}