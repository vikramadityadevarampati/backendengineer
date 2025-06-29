import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Review } from '../entities/Review';
import { Book } from '../entities/Book';
import { cacheService } from '../config/redis';

export class ReviewController {
  private reviewRepository = AppDataSource.getRepository(Review);
  private bookRepository = AppDataSource.getRepository(Book);

  getReviewsByBookId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const bookId = parseInt(id);

      if (isNaN(bookId)) {
        res.status(400).json({ 
          error: 'Invalid book ID',
          details: 'Book ID must be a number'
        });
        return;
      }

      // Check if book exists
      const book = await this.bookRepository.findOne({
        where: { id: bookId }
      });

      if (!book) {
        res.status(404).json({ 
          error: 'Book not found',
          details: `Book with ID ${bookId} does not exist`
        });
        return;
      }

      const cacheKey = `reviews:book:${bookId}`;
      
      // Try cache first
      const cachedReviews = await cacheService.get(cacheKey);
      if (cachedReviews) {
        console.log(`Cache hit for reviews of book ${bookId}`);
        res.json(JSON.parse(cachedReviews));
        return;
      }

      console.log(`Cache miss for reviews of book ${bookId}, fetching from database`);
      
      // Fetch reviews from database with optimized query using the index
      const reviews = await this.reviewRepository.find({
        where: { bookId },
        order: { createdAt: 'DESC' }
      });

      // Cache the result
      const ttl = parseInt(process.env.CACHE_TTL || '300');
      await cacheService.set(cacheKey, JSON.stringify(reviews), ttl);

      res.json(reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: 'Failed to fetch reviews'
      });
    }
  };

  createReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const bookId = parseInt(id);
      const { rating, comment, reviewerName } = req.body;

      if (isNaN(bookId)) {
        res.status(400).json({ 
          error: 'Invalid book ID',
          details: 'Book ID must be a number'
        });
        return;
      }

      // Check if book exists
      const book = await this.bookRepository.findOne({
        where: { id: bookId }
      });

      if (!book) {
        res.status(404).json({ 
          error: 'Book not found',
          details: `Book with ID ${bookId} does not exist`
        });
        return;
      }

      const review = this.reviewRepository.create({
        rating,
        comment,
        reviewerName,
        bookId
      });

      const savedReview = await this.reviewRepository.save(review);

      // Invalidate relevant caches
      await cacheService.del(`reviews:book:${bookId}`);
      await cacheService.del(`book:${bookId}`);
      await cacheService.del('books:all');

      res.status(201).json(savedReview);
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: 'Failed to create review'
      });
    }
  };
}