import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { IsNotEmpty, IsString, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { Book } from './Book';

@Entity('reviews')
@Index(['bookId']) // Index for efficient book review lookups
@Index(['rating']) // Index for rating-based queries
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @Column({ type: 'text' })
  @IsNotEmpty()
  @IsString()
  comment: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  reviewerName?: string;

  @Column()
  bookId: number;

  @ManyToOne(() => Book, book => book.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book: Book;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}