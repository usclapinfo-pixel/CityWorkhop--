import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';

const isProduction = process.env.NODE_ENV === 'production';

const getEnv = (productionKey: string, fallbackKey: string, localFallback: string): string => {
  const productionValue = process.env[productionKey] || process.env[fallbackKey];

  if (isProduction && !productionValue) {
    throw new Error(
      `Missing required production database environment variable: ${productionKey} or ${fallbackKey}`
    );
  }

  return productionValue || process.env[fallbackKey] || localFallback;
};

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: getEnv('SUPABASE_DB_HOST', 'DB_HOST', 'localhost'),
  port: Number(getEnv('SUPABASE_DB_PORT', 'DB_PORT', '5432')),
  username: getEnv('SUPABASE_DB_USER', 'DB_USERNAME', 'postgres'),
  password: getEnv('SUPABASE_DB_PASSWORD', 'DB_PASSWORD', 'postgres'),
  database: getEnv('SUPABASE_DB_NAME', 'DB_DATABASE', 'city_workshop'),
  entities: [path.join(__dirname, '/../modules/**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '/../database/migrations/*{.ts,.js}')],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  extra: {
    max: 20,
  },
};
