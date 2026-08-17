import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const isProduction = process.env.NODE_ENV === 'production';

const isLocalhostLike = (value?: string): boolean => {
  if (!value) {
    return false;
  }

  return ['localhost', '127.0.0.1', '::1'].includes(value.trim().toLowerCase());
};

const getEnv = (productionKey: string, fallbackKey: string, localFallback: string): string => {
  const productionValue = process.env[productionKey];
  const fallbackValue = process.env[fallbackKey];

  if (isProduction) {
    if (productionValue && productionValue.trim()) {
      return productionValue;
    }

    if (fallbackValue && !isLocalhostLike(fallbackValue)) {
      return fallbackValue;
    }

    if (fallbackValue && isLocalhostLike(fallbackValue)) {
      throw new Error(
        `Production database configuration is invalid: ${fallbackKey} resolves to localhost. Set ${productionKey} instead.`
      );
    }

    throw new Error(
      `Missing required production database environment variable: ${productionKey}`
    );
  }

  return productionValue || fallbackValue || localFallback;
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
