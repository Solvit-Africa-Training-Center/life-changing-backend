import { createConnection } from 'typeorm';
import { join } from 'path';
import * as bcrypt from 'bcrypt';
import { User } from '../src/modules/users/entities/user.entity';
import { UserType, Language, ProgramCategory, ProgramStatus } from '../src/config/constants';
import { Program } from 'src/modules/programs/entities/program.entity';

async function seedData() {
  const connection = await createConnection({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'lceo',
    entities: [join(__dirname, '../src/**/*.entity{.ts,.js}')],
    synchronize: false,
    logging: true,
  });

  // Create admin user
  const adminUser = new User();
  adminUser.email = 'admin@lceo.org';
  adminUser.phone = '+250788123456';
  adminUser.password = await bcrypt.hash('Admin@123', 10);
  adminUser.userType = UserType.SUPER_ADMIN;
  adminUser.language = Language.EN;
  adminUser.isVerified = true;
  adminUser.isActive = true;
  
  await connection.manager.save(adminUser);

  // Create default programs
  const programs = [
    {
      name: { en: 'Girls School Retention and Protection', rw: 'Kubungabunga umusaruro w\'abakobwa mu ishuri' },
      description: {
        en: 'Supporting girls to stay in school through practical support and mentorship',
        rw: 'Gufasha abakobwa kugumana mu ishuri binyuze mu gushyigikira no kugirana ubufasha',
        short: {
          en: 'Keep girls in school',
          rw: 'Kubungabunga abakobwa mu ishuri',
        },
      },
      category: ProgramCategory.EDUCATION,
      sdgAlignment: [4, 5],
      kpiTargets: {
        girlsSupported: { target: 500, unit: 'girls', frequency: 'annual' },
        schoolRetentionRate: { target: 85, unit: 'percentage', frequency: 'annual' },
      },
      startDate: new Date('2024-01-01'),
      status: ProgramStatus.ACTIVE,
      budget: 100000000,
      fundsAllocated: 25000000,
      metadata: {
        partners: ['FAWE Rwanda', 'ECORYS'],
        locations: ['Bugesera District'],
        targetDemographic: 'Adolescent girls aged 12-18',
      },
    },
    {
      name: { en: 'IkiraroBiz Entrepreneurship', rw: 'IkiraroBiz Ubuhanga bwo kwihangira' },
      description: {
        en: 'Empowering women through skills development and business creation',
        rw: 'Gutera imbere abagore binyuze mu gukuraho ubuhanga no guhanga ibikorwa',
        short: {
          en: 'Business empowerment for women',
          rw: 'Guhangira ibikorwa by\'abagore',
        },
      },
      category: ProgramCategory.ENTREPRENEURSHIP,
      sdgAlignment: [1, 5, 8],
      kpiTargets: {
        businessesLaunched: { target: 200, unit: 'businesses', frequency: 'annual' },
        incomeIncrease: { target: 50, unit: 'percentage', frequency: 'annual' },
      },
      startDate: new Date('2024-01-01'),
      status: ProgramStatus.ACTIVE,
      budget: 150000000,
      fundsAllocated: 50000000,
      metadata: {
        partners: ['MOR ASSAYAG'],
        locations: ['Bugesera District', 'Kigali City'],
        targetDemographic: 'Women aged 18-35',
      },
    },
  ];

  for (const programData of programs) {
    const program = new Program();
    Object.assign(program, programData);
    await connection.manager.save(program);
  }

  console.log('✅ Seed data created successfully');
  await connection.close();
}

seedData().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});