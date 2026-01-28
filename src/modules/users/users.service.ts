import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { BaseService } from '../../shared/services/base.service';
import { PaginationParams } from '../../shared/interfaces/pagination.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserType } from 'src/config/constants';

@Injectable()
export class UsersService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    super(usersRepository);
  }

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
    return this.findOne(id);
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async deactivateUser(id: string): Promise<User> {
    const user = await this.findById(id);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = false;
    return this.usersRepository.save(user);
  }

  async activateUser(id: string): Promise<User> {
    const user = await this.findById(id);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = true;
    return this.usersRepository.save(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async searchUsers(query: string, paginationParams: PaginationParams) {
    const where = query
      ? [
          { email: query },
          { phone: query },
          { fullName: query },
        ]
      : undefined;

    return this.paginate(paginationParams, where);
  }

   async getUsersByType(userType: string, paginationParams: PaginationParams) {
    // Validate and cast the userType string to UserType enum
    if (!Object.values(UserType).includes(userType as UserType)) {
      throw new NotFoundException(`Invalid user type: ${userType}`);
    }
    
    const where: FindOptionsWhere<User> = { 
      userType: userType as UserType 
    };
    
    return this.paginate(paginationParams, where);
  }

  async countUsersByType(userType?: string): Promise<number> {
    let where: FindOptionsWhere<User> | undefined;
    
    if (userType) {
      if (!Object.values(UserType).includes(userType as UserType)) {
        throw new NotFoundException(`Invalid user type: ${userType}`);
      }
      
      where = { userType: userType as UserType };
    }
    
    return this.count(where);
  }
   async findUserWithRelations(id: string, relations: string[] = []): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations,
    });
  }

  async findUsersWithRoles(paginationParams: PaginationParams, roles?: string[]) {
    const where: FindOptionsWhere<User>[] = [];
    
    if (roles && roles.length > 0) {
      // Validate each role
      const validRoles = roles.filter(role => 
        Object.values(UserType).includes(role as UserType)
      );
      
      if (validRoles.length > 0) {
        where.push(...validRoles.map(role => ({ userType: role as UserType })));
      }
    }
    
    return this.paginate(paginationParams, where.length > 0 ? where : undefined);
  }
}