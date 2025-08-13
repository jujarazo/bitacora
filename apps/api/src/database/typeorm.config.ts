import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DatabaseConfig } from '../config';

export const typeormConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const dbConfig = configService.get<DatabaseConfig>('database');

  if (!dbConfig) {
    throw new Error('Database configuration is not available');
  }

  return {
    type: 'postgres',
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.name,
    username: dbConfig.user,
    password: dbConfig.password,
    ssl: dbConfig.ssl ? { rejectUnauthorized: false } : undefined,
    autoLoadEntities: true,
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
  };
};