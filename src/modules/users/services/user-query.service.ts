// src/modules/users/services/user-query.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { PaginatedResponse, PaginationParams } from '../../../shared/interfaces/pagination.interface';
import { UserType } from '../../../config/constants';

@Injectable()
export class UserQueryService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { phone } });
  }

  async findByEmailOrPhone(identifier: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: [{ email: identifier }, { phone: identifier }],
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findUserWithRelations(id: string, relations: string[] = []): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations,
    });
  }

  async searchUsers(query: string, paginationParams: PaginationParams): Promise<PaginatedResponse<User>> {
    const where = query
      ? [
          { email: query },
          { phone: query },
          { fullName: query },
        ]
      : undefined;

    return this.paginate(paginationParams, where);
  }

  async getPendingActivationUsers(paginationParams: PaginationParams): Promise<PaginatedResponse<User>> {
    const where: FindOptionsWhere<User> = { 
      isActive: false,
      isVerified: true,
      userType: In([UserType.DONOR, UserType.BENEFICIARY])
    };
    
    return this.paginate(paginationParams, where);
  }

  private async paginate(
    paginationParams: PaginationParams,
    where?: FindOptionsWhere<User> | FindOptionsWhere<User>[]
  ): Promise<PaginatedResponse<User>> {
    const page = paginationParams.page || 1;
    const limit = paginationParams.limit || 20;
    const skip = (page - 1) * limit;
    const sortBy = paginationParams.sortBy || 'createdAt';
    const sortOrder = paginationParams.sortOrder || 'DESC';

    const [data, total] = await this.usersRepository.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
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
}