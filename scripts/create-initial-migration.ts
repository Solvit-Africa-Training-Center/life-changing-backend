import { createConnection } from 'typeorm';
import { join } from 'path';

async function createMigration() {
  const connection = await createConnection({
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

  await connection.runMigrations({
    transaction: 'all',
  });

  await connection.close();
}

createMigration().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});