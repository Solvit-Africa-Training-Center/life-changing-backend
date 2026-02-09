// src/shared/seeders/admin.seeder.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../modules/users/entities/user.entity';
import { UserType, Language } from '../../config/constants';

@Injectable()
export class AdminSeeder {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async seed() {
    try {
      // Check if admin already exists
      const existingAdmin = await this.usersRepository.findOne({
        where: [
          { email: 'admin@lceo.org' },
          { email: 'admin@example.com' }
        ]
      });

      if (existingAdmin) {
        this.logger.log('Default admin already exists');
        return;
      }

      // Get admin credentials from environment or use defaults
      const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@lceo.org';
      const adminPhone = process.env.DEFAULT_ADMIN_PHONE || '+250788000000';
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@1234';
      const adminName = process.env.DEFAULT_ADMIN_NAME || 'System Administrator';

      // Create admin user (password will be hashed by @BeforeInsert)
      const adminUser = this.usersRepository.create({
        email: adminEmail,
        phone: adminPhone,
        fullName: adminName,
        password: adminPassword, // Will be hashed by the entity's @BeforeInsert
        userType: UserType.ADMIN,
        language: Language.EN,
        isVerified: true,
        isActive: true,
        verifiedAt: new Date(),
        lastLoginAt: null,
      });

      const savedUser = await this.usersRepository.save(adminUser);

      this.logger.log('✅ Default admin user created successfully!');
      this.logger.log(`📧 Email: ${adminEmail}`);
      this.logger.log(`📱 Phone: ${adminPhone}`);
      this.logger.log(`🔑 Password: ${adminPassword}`);
      
      if (!process.env.DEFAULT_ADMIN_PASSWORD) {
        this.logger.warn('⚠️  CHANGE THE DEFAULT PASSWORD IMMEDIATELY AFTER FIRST LOGIN!');
      }

      return savedUser;

    } catch (error) {
      this.logger.error('Failed to create default admin:', error);
      throw error;
    }
  }
}