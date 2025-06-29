import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Book } from '../entities/Book';
import { Review } from '../entities/Review';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DATABASE_URL || 'database.sqlite',
  synchronize: false, // Use migrations instead
  logging: process.env.NODE_ENV === 'development',
  entities: [Book, Review],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});