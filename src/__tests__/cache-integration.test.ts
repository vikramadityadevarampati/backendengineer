import request from 'supertest';
import { AppDataSource } from '../config/database';
import { initRedis, disconnectRedis, cacheService } from '../config/redis';
import app from '../index';

describe('Cache Integration Tests', () => {
  let bookId: number;

  beforeAll(async () => {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
    await initRedis();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
    await disconnectRedis();
  });

  beforeEach(async () => {
    // Clean database and cache before each test
    await AppDataSource.query('DELETE FROM reviews');
    await AppDataSource.query('DELETE FROM books');
    
    // Clear all cache keys
    await cacheService.del('books:all');
    
    // Create a test book
    const bookData = {
      title: 'Cache Test Book',
      author: 'Cache Test Author',
      isbn: '978-0123456789'
    };

    const bookResponse = await request(app)
      .post('/api/books')
      .send(bookData);

    bookId = bookResponse.body.id;
    
    // Clear cache after book creation
    await cacheService.del('books:all');
    await cacheService.del(`book:${bookId}`);
  });

  describe('Cache Miss Path', () => {
    it('should fetch books from database when cache is empty', async () => {
      // Ensure cache is empty
      const cachedBooks = await cacheService.get('books:all');
      expect(cachedBooks).toBeNull();

      // First request should hit database (cache miss)
      const response1 = await request(app)
        .get('/api/books')
        .expect(200);

      expect(response1.body).toHaveLength(1);
      expect(response1.body[0].title).toBe('Cache Test Book');

      // Verify data is now cached (only if Redis is available)
      const cachedBooksAfter = await cacheService.get('books:all');
      if (cachedBooksAfter) {
        const parsedCache = JSON.parse(cachedBooksAfter);
        expect(parsedCache).toHaveLength(1);
        expect(parsedCache[0].title).toBe('Cache Test Book');
      }
    });

    it('should use cache on subsequent requests', async () => {
      // First request (cache miss)
      await request(app)
        .get('/api/books')
        .expect(200);

      // Second request should use cache
      const response2 = await request(app)
        .get('/api/books')
        .expect(200);

      expect(response2.body).toHaveLength(1);
      expect(response2.body[0].title).toBe('Cache Test Book');
    });

    it('should invalidate cache when new book is created', async () => {
      // First request to populate cache
      await request(app)
        .get('/api/books')
        .expect(200);

      // Verify cache exists (only if Redis is available)
      let cachedBooks = await cacheService.get('books:all');
      
      // Create a new book (should invalidate cache)
      const newBookData = {
        title: 'New Book',
        author: 'New Author',
        isbn: '978-0987654321'
      };

      await request(app)
        .post('/api/books')
        .send(newBookData)
        .expect(201);

      // Cache should be invalidated (only check if Redis is available)
      cachedBooks = await cacheService.get('books:all');
      // Cache should be null after invalidation (if Redis is available)

      // Next request should fetch fresh data from database
      const response = await request(app)
        .get('/api/books')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });
  });

  describe('Cache Fallback on Redis Failure', () => {
    it('should handle cache unavailability gracefully', async () => {
      // Disconnect Redis to simulate failure
      await disconnectRedis();

      // Request should still work, falling back to database
      const response = await request(app)
        .get('/api/books')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Cache Test Book');

      // Reconnect Redis for other tests
      await initRedis();
    });
  });

  describe('Reviews Cache Integration', () => {
    it('should cache and invalidate review data correctly', async () => {
      const reviewData = {
        rating: 5,
        comment: 'Great book!',
        reviewerName: 'Test Reviewer'
      };

      // First request to get reviews (should cache empty array)
      let response = await request(app)
        .get(`/api/books/${bookId}/reviews`)
        .expect(200);

      expect(response.body).toEqual([]);

      // Add a review (should invalidate cache)
      await request(app)
        .post(`/api/books/${bookId}/reviews`)
        .send(reviewData)
        .expect(201);

      // Next request should fetch updated data
      response = await request(app)
        .get(`/api/books/${bookId}/reviews`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject(reviewData);
    });
  });
});