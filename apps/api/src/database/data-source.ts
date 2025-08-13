import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config({ path: '../../.env' });

const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT || '5432', 10);
const database = process.env.DB_NAME || 'bitacora';
const username = process.env.DB_USER || 'postgres';
const password = process.env.DB_PASSWORD || 'postgres';
const ssl = process.env.DB_SSL === 'true';

export default new DataSource({
  type: 'postgres',
  host,
  port,
  database,
  username,
  password,
  ssl: ssl ? { rejectUnauthorized: false } : undefined,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});