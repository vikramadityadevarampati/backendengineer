import request from 'supertest';
import { AppDataSource } from '../config/database';
import app from '../index';

describe('Books API', () => {
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
  });

  describe('POST /api/books', () => {
    it('should create a new book successfully', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        isbn: '978-0123456789',
        publishedYear: 2023,
        description: 'A test book for unit testing'
      };

      const response = await request(app)
        .post('/api/books')
        .send(bookData)
        .expect(201);

      expect(response.body).toMatchObject({
        title: bookData.title,
        author: bookData.author,
        isbn: bookData.isbn,
        publishedYear: bookData.publishedYear,
        description: bookData.description
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('should return 400 for invalid data', async () => {
      const invalidBookData = {
        title: '', // Empty title should fail validation
        author: 'Test Author',
        isbn: '978-0123456789'
      };

      const response = await request(app)
        .post('/api/books')
        .send(invalidBookData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 409 for duplicate ISBN', async () => {
      const bookData = {
        title: 'First Book',
        author: 'Test Author',
        isbn: '978-0123456789'
      };

      // Create first book
      await request(app)
        .post('/api/books')
        .send(bookData)
        .expect(201);

      // Try to create second book with same ISBN
      const duplicateBook = {
        title: 'Second Book',
        author: 'Another Author',
        isbn: '978-0123456789' // Same ISBN
      };

      const response = await request(app)
        .post('/api/books')
        .send(duplicateBook)
        .expect(409);

      expect(response.body.error).toBe('Book already exists');
    });
  });

  describe('GET /api/books', () => {
    it('should return empty array when no books exist', async () => {
      const response = await request(app)
        .get('/api/books')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all books', async () => {
      // Create test books
      const book1 = {
        title: 'Book 1',
        author: 'Author 1',
        isbn: '978-0123456781'
      };

      const book2 = {
        title: 'Book 2',
        author: 'Author 2',
        isbn: '978-0123456782'
      };

      await request(app).post('/api/books').send(book1);
      await request(app).post('/api/books').send(book2);

      const response = await request(app)
        .get('/api/books')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject(book1);
      expect(response.body[1]).toMatchObject(book2);
    });
  });

  describe('GET /api/books/:id', () => {
    it('should return a book by ID', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        isbn: '978-0123456789'
      };

      const createResponse = await request(app)
        .post('/api/books')
        .send(bookData);

      const bookId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/books/${bookId}`)
        .expect(200);

      expect(response.body).toMatchObject(bookData);
      expect(response.body.id).toBe(bookId);
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .get('/api/books/999')
        .expect(404);

      expect(response.body.error).toBe('Book not found');
    });

    it('should return 400 for invalid book ID', async () => {
      const response = await request(app)
        .get('/api/books/invalid-id')
        .expect(400);

      expect(response.body.error).toBe('Invalid book ID');
    });
  });
});