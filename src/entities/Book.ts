import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { IsNotEmpty, IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Review } from './Review';

@Entity('books')
@Index(['title', 'author']) // Composite index for common queries
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty()
  @IsString()
  title: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  author: string;

  @Column({ unique: true })
  @IsNotEmpty()
  @IsString()
  isbn: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  publishedYear?: number;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @OneToMany(() => Review, review => review.book, { cascade: true })
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}