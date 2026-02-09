// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { DatabaseConfig } from '../../config/database.config';

// @Module({
//   imports: [
//     TypeOrmModule.forRootAsync({
//       useClass: DatabaseConfig,
//     }),
//   ],
//   exports: [TypeOrmModule],
// })
// export class DatabaseModule {}

// src/database/database.module.ts
import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfig } from '../../config/database.config';
import { User } from '../../modules/users/entities/user.entity';
import { AdminSeeder } from '../seeders/admin.seeder';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    TypeOrmModule.forFeature([User]), // Add this for seeder
  ],
  providers: [AdminSeeder],
  exports: [TypeOrmModule],
})
export class DatabaseModule implements OnApplicationBootstrap {
  constructor(private readonly adminSeeder: AdminSeeder) {}

  async onApplicationBootstrap() {
    // Auto-run seeder in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      await this.adminSeeder.seed();
    }
  }
}
