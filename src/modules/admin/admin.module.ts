// src/modules/admin/admin.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogService } from './activity-log.service';
import { AdminController } from './controllers/admin.controller';
import { ActivityLog } from './entities/activity-log.entity';
import { UsersModule } from '../users/users.module';
import { StaffController } from './controllers/staff.controller';
import { StaffService } from './services/staff.service';
import { Staff } from './entities/staff.entity';
import { User } from '../users/entities/user.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([Staff, ActivityLog, User]),
    forwardRef(() => UsersModule), 
  ],
  controllers: [StaffController, AdminController],
  providers: [StaffService, ActivityLogService],
  exports: [StaffService, ActivityLogService],

})
export class AdminModule {}