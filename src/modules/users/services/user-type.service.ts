// src/modules/users/services/user-type.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, FindOptionsWhere } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { PaginatedResponse, PaginationParams } from '../../../shared/interfaces/pagination.interface';
import { UserType } from '../../../config/constants';

@Injectable()
export class UserTypeService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getUsersByType(userType: string, paginationParams: PaginationParams): Promise<PaginatedResponse<User>> {
    this.validateUserType(userType);
    
    const where: FindOptionsWhere<User> = { 
      userType: userType as UserType 
    };
    
    return this.paginate(paginationParams, where);
  }

  async countUsersByType(userType?: string): Promise<number> {
    let where: FindOptionsWhere<User> | undefined;
    
    if (userType) {
      this.validateUserType(userType);
      where = { userType: userType as UserType };
    }
    
    return this.usersRepository.count({ where });
  }

  async findUsersWithRoles(paginationParams: PaginationParams, roles?: string[]): Promise<PaginatedResponse<User>> {
    const where: FindOptionsWhere<User>[] = [];
    
    if (roles && roles.length > 0) {
      const validRoles = this.validateAndFilterRoles(roles);
      
      if (validRoles.length > 0) {
        where.push(...validRoles.map(role => ({ userType: role as UserType })));
      }
    }
    
    return this.paginate(paginationParams, where.length > 0 ? where : undefined);
  }

  private validateUserType(userType: string): void {
    if (!Object.values(UserType).includes(userType as UserType)) {
      throw new NotFoundException(`Invalid user type: ${userType}`);
    }
  }

  private validateAndFilterRoles(roles: string[]): string[] {
    return roles.filter(role => 
      Object.values(UserType).includes(role as UserType)
    );
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