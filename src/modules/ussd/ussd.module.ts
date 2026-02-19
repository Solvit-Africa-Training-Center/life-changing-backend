// src/modules/ussd/ussd.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UssdController } from './controllers/ussd.controller';
import { UssdSession } from './entities/ussd-session.entity';
import { UsersModule } from '../users/users.module';
import { BeneficiariesModule } from '../beneficiaries/beneficiaries.module';
import { UssdStatsService } from './services/ussd-stats.service';
import { UssdStatsController } from './controllers/ussd-stats.controller';
import { UssdService } from './services/ussd.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([UssdSession]),
        UsersModule,
        BeneficiariesModule,
    ],
    controllers: [UssdController, UssdStatsController],
    providers: [UssdService, UssdStatsService],
    exports: [UssdService,UssdStatsService],
})
export class UssdModule { }
