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
import { plainToInstance } from 'class-transformer';

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

    const savedDonor = await this.donorsRepository.save(donor);
    return plainToInstance(Donor, savedDonor);
  }

  async findDonorByUserId(userId: string): Promise<Donor | null> {
    const donor = await this.donorsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'donations', 'recurringDonations'],
    });

    if (!donor) return null;

    return plainToInstance(Donor, donor);
  }


  async findDonorById(id: string): Promise<Donor | null> {
    const donor = await this.donorsRepository.findOne({
      where: { id },
      relations: ['user', 'donations', 'recurringDonations'],
    });

    if (!donor) return null;

    return plainToInstance(Donor, donor);
  }

  async updateDonor(donorId: string, updateDonorDto: UpdateDonorDto): Promise<Donor> {
    const donor = await this.findOne(donorId, ['user']);

    if (!donor) {
      throw new NotFoundException('Donor not found');
    }
    Object.assign(donor, updateDonorDto);
    const updatedDonor = await this.donorsRepository.save(donor);
    return plainToInstance(Donor, updatedDonor);
  }

  async updateDonorTotal(donorId: string, amount: number): Promise<void> {
    await this.donorsRepository.update(donorId, {
      totalDonated: () => `total_donated + ${amount}`,
      lastDonationDate: new Date(),
    });
  }

  async getDonorsByCountry(country: string, paginationParams: PaginationParams): Promise<PaginatedResponse<Donor>> {
    const where: FindOptionsWhere<Donor> = { country };
    const result = await this.paginate(paginationParams, where, ['user']);

    const transformedData = result.data.map(donor => plainToInstance(Donor, donor));

    return {
      ...result,
      data: transformedData
    };
  }

  async getTopDonors(limit: number = 10): Promise<Donor[]> {
    const donors = await this.donorsRepository.find({
      where: { anonymityPreference: false },
      order: { totalDonated: 'DESC' },
      take: limit,
      relations: ['user'],
    });

    return donors.map(donor => plainToInstance(Donor, donor));
  }

  async searchDonors(query: string, paginationParams: PaginationParams): Promise<PaginatedResponse<Donor>> {
    const page = paginationParams.page || 1;
    const limit = paginationParams.limit || 20;
    const skip = (page - 1) * limit;
    const sortBy = paginationParams.sortBy || 'createdAt';
    const sortOrder = paginationParams.sortOrder || 'DESC';

    // Create query builder for counting (to get total)
    const countQueryBuilder = this.donorsRepository
      .createQueryBuilder('donor')
      .leftJoin('donor.user', 'user')
      .where('LOWER(user.fullName) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('LOWER(donor.country) LIKE LOWER(:query)', { query: `%${query}%` });

    // Get total count
    const total = await countQueryBuilder.getCount();

    // Create query builder for paginated results
    const dataQueryBuilder = this.donorsRepository
      .createQueryBuilder('donor')
      .leftJoinAndSelect('donor.user', 'user')
      .where('LOWER(user.fullName) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('LOWER(donor.country) LIKE LOWER(:query)', { query: `%${query}%` });

    // Apply sorting
    if (sortBy === 'fullName') {
      dataQueryBuilder.orderBy('user.fullName', sortOrder);
    } else if (sortBy.includes('user.')) {
      const field = sortBy.replace('user.', '');
      dataQueryBuilder.orderBy(`user.${field}`, sortOrder);
    } else {
      dataQueryBuilder.orderBy(`donor.${sortBy}`, sortOrder);
    }

    // Apply pagination
    const donors = await dataQueryBuilder
      .skip(skip)
      .take(limit)
      .getMany();

    const transformedData = donors.map(donor => plainToInstance(Donor, donor));
    const totalPages = Math.ceil(total / limit);

    return {
      data: transformedData,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
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

  async findOne(id: string, relations: string[] = []): Promise<Donor | null> {
    const entity = await this.donorsRepository.findOne({
      where: { id },
      relations
    });

    if (!entity) return null;

    return plainToInstance(Donor, entity);
  }
}