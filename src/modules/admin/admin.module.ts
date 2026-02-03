// src/modules/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogService } from './activity-log.service';
import { AdminController } from './controllers/admin.controller';
import { ActivityLog } from './entities/activity-log.entity';
import { UsersModule } from '../users/users.module';
import { StaffController } from './controllers/staff.controller';
import { StaffService } from './services/staff.service';
import { Staff } from './entities/staff.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Staff, ActivityLog]),
    UsersModule,
  ],
  controllers: [StaffController, AdminController],
  providers: [StaffService, ActivityLogService],
  exports: [StaffService, ActivityLogService],
})
export class AdminModule {}