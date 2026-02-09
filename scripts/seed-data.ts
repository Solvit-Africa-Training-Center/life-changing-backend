import { DataSource } from 'typeorm';
import { join } from 'path';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User } from '../src/modules/users/entities/user.entity';
import { UserType, Language, ProgramCategory, ProgramStatus, StaffRole } from '../src/config/constants';
import { Program } from '../src/modules/programs/entities/program.entity';
import { Staff } from '../src/modules/users/entities/staff.entity';
import { Story } from '../src/modules/content/entities/story.entity';
import { AuthorRole } from '../src/config/constants';

// Load environment variables
dotenv.config();

async function seedData() {
  const dataSource = new DataSource({
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

  // Initialize the DataSource
  await dataSource.initialize();
  
  console.log('🌱 Starting seed data...');

  // Check if admin user already exists
  const existingAdmin = await dataSource.manager.findOne(User, {
    where: { email: 'admin@lceo.org' }
  });

  if (existingAdmin) {
    console.log('⚠️ Admin user already exists, skipping creation...');
  } else {
    // Create admin user
    const adminUser = new User();
    adminUser.email = 'admin@lceo.org';
    adminUser.phone = '+250788123456';
    adminUser.password = await bcrypt.hash('Admin@123', 10);
    adminUser.userType = UserType.ADMIN;
    adminUser.language = Language.EN;
    adminUser.isVerified = true;
    adminUser.isActive = true;
    
    await dataSource.manager.save(adminUser);
    console.log('✅ Admin user created');

    // Also create a Staff record for the admin
    const adminStaff = new Staff();
    adminStaff.user = adminUser;
    adminStaff.fullName = 'System Administrator';
    adminStaff.role = StaffRole.SUPER_ADMIN;
    adminStaff.department = 'Administration';
    adminStaff.employeeId = 'ADMIN001';
    adminStaff.hireDate = new Date();
    adminStaff.isActive = true;
    
    await dataSource.manager.save(adminStaff);
    console.log('✅ Admin staff record created');
  }

  // Create default programs if they don't exist
  const existingPrograms = await dataSource.manager.find(Program);
  
  if (existingPrograms.length === 0) {
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
      await dataSource.manager.save(program);
    }
    console.log(`✅ ${programs.length} default programs created`);
  } else {
    console.log(`⚠️ ${existingPrograms.length} programs already exist, skipping creation...`);
  }

   
  // Seed Stories / Testimonials
 

  const existingStories = await dataSource.manager.find(Story);

  if (existingStories.length > 0) {
    console.log(`⚠️ ${existingStories.length} stories already exist, skipping story seeding...`);
  } else {
    const programs = await dataSource.manager.find(Program);

    const stories: Partial<Story>[] = [
      {
        title: {
          en: 'Education Changed My Future',
          rw: 'Uburezi bwahinduye ejo hazaza hanjye',
        },
        content: {
          en: 'Through the support of LCEO, I was able to stay in school and complete my studies.',
          rw: 'Kubera ubufasha bwa LCEO, nabashije kuguma mu ishuri no gusoza amasomo yanjye.',
        },
        authorName: 'Aline Mukamana',
        authorRole: AuthorRole.BENEFICIARY,
        isFeatured: true,
        isPublished: true,
        publishedDate: new Date('2024-06-01'),
        language: Language.EN,
        viewCount: 120,
        shareCount: 15,
        metadata: {
          tags: ['education', 'girls', 'success'],
          location: 'Bugesera',
          duration: 12,
        },
        program: programs[0] ?? null,
      },
      {
        title: {
          en: 'From Skills Training to Business Owner',
          rw: 'Kuva mu mahugurwa kugera ku kwihangira imirimo',
        },
        content: {
          en: 'The entrepreneurship program helped me start my own tailoring business.',
          rw: 'Porogaramu y’ubuhanga bwo kwihangira imirimo yampaye ubushobozi bwo gutangiza akazi kanjye.',
        },
        authorName: 'Ishimwe Diane ',
        authorRole: AuthorRole.BENEFICIARY,
        isFeatured: false,
        isPublished: true,
        publishedDate: new Date('2024-07-10'),
        language: Language.EN,
        viewCount: 85,
        shareCount: 8,
        metadata: {
          tags: ['entrepreneurship', 'youth'],
          location: 'Kigali',
          duration: 8,
        },
        program: programs[1] ?? null,
      },
      {
        title: {
          en: 'Community Impact Through Partnership',
          rw: 'Uruhare rw’ubufatanye mu iterambere ry’umuryango',
        },
        content: {
          en: 'Working with partners has allowed us to reach more beneficiaries.',
          rw: 'Gukorana n’abafatanyabikorwa byadufashije kugera ku bantu benshi.',
        },
        authorName: 'LCEO Team',
        authorRole: AuthorRole.STAFF,
        isFeatured: false,
        isPublished: true,
        publishedDate: new Date('2024-08-05'),
        language: Language.EN,
        viewCount: 60,
        shareCount: 5,
        metadata: {
          tags: ['impact', 'community'],
          location: 'Bugesera',
          duration: 5,
        },
        program: undefined,
      },
    ];

    for (const storyData of stories) {
      const story = new Story();
      Object.assign(story, storyData);
      await dataSource.manager.save(story);
    }

    console.log(`✅ ${stories.length} stories seeded successfully`);
  }





  console.log('✅ Seed data completed successfully');
  await dataSource.destroy();
}

seedData().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);


});