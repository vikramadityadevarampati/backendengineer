import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Book } from '../entities/Book';
import { cacheService } from '../config/redis';

export class BookController {
  private bookRepository = AppDataSource.getRepository(Book);

  getAllBooks = async (req: Request, res: Response): Promise<void> => {
    try {
      const cacheKey = 'books:all';
      
      // Try to get from cache first
      const cachedBooks = await cacheService.get(cacheKey);
      if (cachedBooks) {
        console.log('Cache hit for books list');
        res.json(JSON.parse(cachedBooks));
        return;
      }

      console.log('Cache miss for books list, fetching from database');
      
      // Fetch from database
      const books = await this.bookRepository.find({
        relations: ['reviews'],
        order: { createdAt: 'DESC' }
      });

      // Cache the result
      const ttl = parseInt(process.env.CACHE_TTL || '300');
      await cacheService.set(cacheKey, JSON.stringify(books), ttl);

      res.json(books);
    } catch (error) {
      console.error('Error fetching books:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: 'Failed to fetch books'
      });
    }
  };

  getBookById = async (req: Request, res: Response): Promise<void> => {
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

      const cacheKey = `book:${bookId}`;
      
      // Try cache first
      const cachedBook = await cacheService.get(cacheKey);
      if (cachedBook) {
        console.log(`Cache hit for book ${bookId}`);
        res.json(JSON.parse(cachedBook));
        return;
      }

      console.log(`Cache miss for book ${bookId}, fetching from database`);
      
      const book = await this.bookRepository.findOne({
        where: { id: bookId },
        relations: ['reviews']
      });

      if (!book) {
        res.status(404).json({ 
          error: 'Book not found',
          details: `Book with ID ${bookId} does not exist`
        });
        return;
      }

      // Cache the result
      const ttl = parseInt(process.env.CACHE_TTL || '300');
      await cacheService.set(cacheKey, JSON.stringify(book), ttl);

      res.json(book);
    } catch (error) {
      console.error('Error fetching book:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: 'Failed to fetch book'
      });
    }
  };

  createBook = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, author, isbn, publishedYear, description } = req.body;

      // Check if book with ISBN already exists
      const existingBook = await this.bookRepository.findOne({
        where: { isbn }
      });

      if (existingBook) {
        res.status(409).json({ 
          error: 'Book already exists',
          details: `Book with ISBN ${isbn} already exists`
        });
        return;
      }

      const book = this.bookRepository.create({
        title,
        author,
        isbn,
        publishedYear,
        description
      });

      const savedBook = await this.bookRepository.save(book);

      // Invalidate books cache
      await cacheService.del('books:all');

      res.status(201).json(savedBook);
    } catch (error) {
      console.error('Error creating book:', error);
      
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(409).json({ 
          error: 'Book already exists',
          details: 'A book with this ISBN already exists'
        });
        return;
      }

      res.status(500).json({ 
        error: 'Internal server error',
        details: 'Failed to create book'
      });
    }
  };
}