// src/modules/admin/services/staff.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Staff } from '../entities/staff.entity';
import { User } from '../../users/entities/user.entity';
import { BaseService } from '../../../shared/services/base.service';
import { PaginationParams, PaginatedResponse } from '../../../shared/interfaces/pagination.interface';
import { CreateStaffDto } from '../dto/create-staff.dto';
import { UpdateStaffDto } from '../dto/update-staff.dto';
import { UserType } from '../../../config/constants';
import { StaffStatsDto } from '../dto/staff-stats.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class StaffService extends BaseService<Staff> {
  constructor(
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    super(staffRepository);
  }

  async createStaff(userId: string, createStaffDto: CreateStaffDto): Promise<Staff> {
    // Check if user exists
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has a staff profile
    const existingStaff = await this.staffRepository.findOne({
      where: { user: { id: userId } },
    });

    if (existingStaff) {
      throw new ConflictException('User already has a staff profile');
    }

    // Update user type
    user.userType = UserType.ADMIN;
    await this.usersRepository.save(user);

    const staffData = {
      user,
      position: createStaffDto.position,
      department: createStaffDto.department,
      contactInfo: createStaffDto.contactInfo,
    } as Staff;

    // Create staff profile
    const staff = this.staffRepository.create(staffData);
    const savedStaff = await this.staffRepository.save(staff);

    // Convert to trigger @Exclude()
    return plainToInstance(Staff, savedStaff);
  }

  async findStaffByUserId(userId: string): Promise<Staff | null> {
    const staff = this.staffRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!staff) return null;

    // Convert to plain object and then back to instance to trigger @Exclude()
    return plainToInstance(Staff, staff);
  }


  async updateStaff(staffId: string, updateStaffDto: UpdateStaffDto): Promise<Staff> {
    const staff = await this.findOne(staffId, ['user']);

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    Object.assign(staff, updateStaffDto);
    const updatedStaff = await this.staffRepository.save(staff);

    return plainToInstance(Staff, updatedStaff);
  }


  async getStaffByDepartment(department: string, paginationParams: PaginationParams): Promise<PaginatedResponse<Staff>> {
    const where: FindOptionsWhere<Staff> = { department };
    const result = await this.paginate(paginationParams, where, ['user']);

    // Transform each staff item
    const transformedData = result.data.map(staff => plainToInstance(Staff, staff));

    return {
      ...result,
      data: transformedData
    };
  }

  async searchStaff(query: string, paginationParams: PaginationParams): Promise<PaginatedResponse<Staff>> {
    const where: FindOptionsWhere<Staff>[] = [
      { position: query },
      { department: query },
    ];

    const result = await this.paginate(paginationParams, where.length > 0 ? where : undefined, ['user']);

    const transformedData = result.data.map(staff => plainToInstance(Staff, staff));

    return {
      ...result,
      data: transformedData
    };
  }

  async getStaffStats(): Promise<{ totalStaff: number, byDepartment: any[] }> {
    const totalStaff = await this.count();

    const byDepartment = await this.staffRepository
      .createQueryBuilder('staff')
      .select('staff.department, COUNT(*) as count')
      .where('staff.department IS NOT NULL')
      .groupBy('staff.department')
      .getRawMany();

    return {
      totalStaff,
      byDepartment,
    };
  }

  async findOne(id: string, relations: string[] = []): Promise<Staff | null> {
    const entity = await this.staffRepository.findOne({
      where: { id },
      relations
    });

    if (!entity) return null;

    return plainToInstance(Staff, entity);
  }
}