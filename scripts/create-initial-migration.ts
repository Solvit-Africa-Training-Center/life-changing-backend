import { DataSource } from 'typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createMigration() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'lceo',
    entities: [join(__dirname, '../src/**/*.entity{.ts,.js}')],
    migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
    synchronize: false,
    logging: true,
  });

  // Initialize the DataSource
  await dataSource.initialize();
  
  console.log('Running migrations...');
  
  await dataSource.runMigrations({
    transaction: 'all',
  });

  console.log('Migrations completed successfully!');
  
  await dataSource.destroy();
}

createMigration().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});