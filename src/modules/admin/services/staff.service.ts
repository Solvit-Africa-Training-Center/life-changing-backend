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
import { UserType, StaffRole } from '../../../config/constants';

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

    // Parse hire date if provided
    const staffData: any = { ...createStaffDto };
    if (createStaffDto.hireDate) {
      staffData.hireDate = new Date(createStaffDto.hireDate);
    }

    // Create staff profile
    const staff = this.staffRepository.create({
      user,
      ...staffData,
    });

    return await this.staffRepository.save(staff);
  }

  async findStaffByUserId(userId: string): Promise<Staff | null> {
    return this.staffRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async updateStaff(staffId: string, updateStaffDto: UpdateStaffDto): Promise<Staff> {
    const staff = await this.findOne(staffId, ['user']);
    
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    Object.assign(staff, updateStaffDto);
    return await this.staffRepository.save(staff);
  }

  async deactivateStaff(staffId: string): Promise<Staff> {
    const staff = await this.findOne(staffId);
    
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    staff.isActive = false;
    return await this.staffRepository.save(staff);
  }

  async activateStaff(staffId: string): Promise<Staff> {
    const staff = await this.findOne(staffId);
    
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    staff.isActive = true;
    return await this.staffRepository.save(staff);
  }

  async getStaffByRole(role: StaffRole, paginationParams: PaginationParams): Promise<PaginatedResponse<Staff>> {
    const where: FindOptionsWhere<Staff> = { role, isActive: true };
    return this.paginate(paginationParams, where, ['user']);
  }

  async searchStaff(query: string, paginationParams: PaginationParams): Promise<PaginatedResponse<Staff>> {
    const where: FindOptionsWhere<Staff>[] = [
      { fullName: query },
      { department: query },
      { employeeId: query },
    ];

    return this.paginate(paginationParams, where.length > 0 ? where : undefined, ['user']);
  }

  async getStaffStats(): Promise<any> {
    const totalStaff = await this.count();
    const activeStaff = await this.count({ isActive: true });
    
    const byRole = await this.staffRepository
      .createQueryBuilder('staff')
      .select('staff.role, COUNT(*) as count')
      .where('staff.is_active = :isActive', { isActive: true })
      .groupBy('staff.role')
      .getRawMany();

    const byDepartment = await this.staffRepository
      .createQueryBuilder('staff')
      .select('staff.department, COUNT(*) as count')
      .where('staff.is_active = :isActive AND staff.department IS NOT NULL', { isActive: true })
      .groupBy('staff.department')
      .getRawMany();

    return {
      totalStaff,
      activeStaff,
      byRole,
      byDepartment,
    };
  }
}