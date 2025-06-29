import request from 'supertest';
import { AppDataSource } from '../config/database';
import app from '../index';

describe('Reviews API', () => {
  let bookId: number;

  beforeAll(async () => {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    // Clean database before each test
    await AppDataSource.query('DELETE FROM reviews');
    await AppDataSource.query('DELETE FROM books');

    // Create a test book for reviews
    const bookData = {
      title: 'Test Book for Reviews',
      author: 'Test Author',
      isbn: '978-0123456789'
    };

    const bookResponse = await request(app)
      .post('/api/books')
      .send(bookData);

    bookId = bookResponse.body.id;
  });

  describe('POST /api/books/:id/reviews', () => {
    it('should create a review successfully', async () => {
      const reviewData = {
        rating: 5,
        comment: 'Excellent book!',
        reviewerName: 'Test Reviewer'
      };

      const response = await request(app)
        .post(`/api/books/${bookId}/reviews`)
        .send(reviewData)
        .expect(201);

      expect(response.body).toMatchObject({
        rating: reviewData.rating,
        comment: reviewData.comment,
        reviewerName: reviewData.reviewerName,
        bookId: bookId
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('should return 400 for invalid rating', async () => {
      const invalidReviewData = {
        rating: 6, // Invalid rating (should be 1-5)
        comment: 'Great book!'
      };

      const response = await request(app)
        .post(`/api/books/${bookId}/reviews`)
        .send(invalidReviewData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 404 for non-existent book', async () => {
      const reviewData = {
        rating: 4,
        comment: 'Good book'
      };

      const response = await request(app)
        .post('/api/books/999/reviews')
        .send(reviewData)
        .expect(404);

      expect(response.body.error).toBe('Book not found');
    });
  });

  describe('GET /api/books/:id/reviews', () => {
    it('should return empty array when no reviews exist', async () => {
      const response = await request(app)
        .get(`/api/books/${bookId}/reviews`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all reviews for a book', async () => {
      // Create test reviews
      const review1 = {
        rating: 5,
        comment: 'Excellent!',
        reviewerName: 'Reviewer 1'
      };

      const review2 = {
        rating: 4,
        comment: 'Very good',
        reviewerName: 'Reviewer 2'
      };

      await request(app)
        .post(`/api/books/${bookId}/reviews`)
        .send(review1);

      await request(app)
        .post(`/api/books/${bookId}/reviews`)
        .send(review2);

      const response = await request(app)
        .get(`/api/books/${bookId}/reviews`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      
      // Reviews should be ordered by createdAt DESC
      expect(response.body[0]).toMatchObject(review2);
      expect(response.body[1]).toMatchObject(review1);
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .get('/api/books/999/reviews')
        .expect(404);

      expect(response.body.error).toBe('Book not found');
    });
  });
});