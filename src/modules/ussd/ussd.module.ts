<<<<<<< HEAD
import { Module } from '@nestjs/common';
import { UssdController } from './ussd.controller';
import { UssdService } from './ussd.service';

@Module({
  controllers: [UssdController],
  providers: [UssdService]
})
export class UssdModule {}
=======
// // src/modules/ussd/ussd.module.ts
// import { Module, Global } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { ScheduleModule } from '@nestjs/schedule';
// import { CacheModule } from '@nestjs/cache-manager';

// import { UssdService } from './ussd.service';
// import { UssdController } from './ussd.controller';
// import { UssdSession } from './entities/ussd-session.entity';
// import { UsersModule } from '../users/users.module';
// import { BeneficiariesModule } from '../beneficiaries/beneficiaries.module';
// import { NotificationsModule } from '../notifications/notifications.module';
// import { DonationsModule } from '../donations/donations.module';
// import { ProgramsModule } from '../programs/programs.module';
// import { CACHE_TTL } from '../../config/constants';

// @Global()
// @Module({
//   imports: [
//     TypeOrmModule.forFeature([UssdSession]),
//     ScheduleModule.forRoot(),
//     CacheModule.register({
//       ttl: CACHE_TTL,
//       max: 100,
//     }),
//     UsersModule,
//     BeneficiariesModule,
//     NotificationsModule,
//     DonationsModule,
//     ProgramsModule,
//   ],
//   controllers: [UssdController],
//   providers: [UssdService],
//   exports: [UssdService, TypeOrmModule],
// })
// export class UssdModule {}
>>>>>>> origin/dev
