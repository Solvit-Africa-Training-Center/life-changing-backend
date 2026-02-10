import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../entities/user.entity';
import { BaseService } from '../../../shared/services/base.service';
import { PaginatedResponse, PaginationParams } from '../../../shared/interfaces/pagination.interface';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ActivateUserDto } from '../dto/activate-user.dto';

import { UserQueryService } from './user-query.service';
import { UserTypeService } from './user-type.service';
import { UserProfileService } from './user-profile.service';
import { UserActivationService } from './user-activation.service';
import { UserStatusService } from './user-status.service';


@Injectable()
export class UsersService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    private userQueryService: UserQueryService,
    private userTypeService: UserTypeService,
    private userProfileService: UserProfileService,
    private userActivationService: UserActivationService,
    private userStatusService: UserStatusService,

  ) {
    super(usersRepository);
  }
  // Query methods (delegated)
  async findByEmail(email: string): Promise<User | null> {
    return this.userQueryService.findByEmail(email);
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userQueryService.findByPhone(phone);
  }

  async findByEmailOrPhone(identifier: string): Promise<User | null> {
    return this.userQueryService.findByEmailOrPhone(identifier);
  }

  async findById(id: string): Promise<User | null> {
    return this.userQueryService.findById(id);
  }

  async findUserWithRelations(id: string, relations: string[] = []): Promise<User | null> {
    return this.userQueryService.findUserWithRelations(id, relations);
  }

  async searchUsers(query: string, paginationParams: PaginationParams): Promise<PaginatedResponse<User>> {
    return this.userQueryService.searchUsers(query, paginationParams);
  }

  async getPendingActivationUsers(paginationParams: PaginationParams): Promise<PaginatedResponse<User>> {
    return this.userQueryService.getPendingActivationUsers(paginationParams);
  }

  // User type methods (delegated)
  async getUsersByType(userType: string, paginationParams: PaginationParams): Promise<PaginatedResponse<User>> {
    return this.userTypeService.getUsersByType(userType, paginationParams);
  }

  async countUsersByType(userType?: string): Promise<number> {
    return this.userTypeService.countUsersByType(userType);
  }

  async findUsersWithRoles(paginationParams: PaginationParams, roles?: string[]): Promise<PaginatedResponse<User>> {
    return this.userTypeService.findUsersWithRoles(paginationParams, roles);
  }

  // Profile methods (delegated)
  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    return this.userProfileService.updateUser(id, updateUserDto);
  }

  async updateLastLogin(id: string): Promise<void> {
    return this.userProfileService.updateLastLogin(id);
  }

  // Activation methods (delegated)
  async activateUser(userId: string, activateDto: ActivateUserDto, adminId?: string): Promise<User> {
    return this.userActivationService.activateUser(userId, activateDto, adminId);
  }

  // Status methods (delegated)
  async getUserStatus(userId: string): Promise<any> {
    return this.userStatusService.getUserStatus(userId);
  }
}