# Book Review Backend

A RESTful API service for managing books and their reviews, built with TypeScript, Express.js, TypeORM, and Redis caching.

## Features

- **RESTful API Design**: Clean, semantic HTTP endpoints
- **Database Management**: SQLite with TypeORM for data persistence
- **Caching Layer**: Redis integration with graceful fallback
- **Data Validation**: Request validation using class-validator
- **API Documentation**: OpenAPI/Swagger documentation
- **Comprehensive Testing**: Unit and integration tests
- **Error Handling**: Robust error handling with meaningful messages
- **Performance Optimization**: Database indexing for efficient queries

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite with TypeORM
- **Cache**: Redis
- **Testing**: Jest with Supertest
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator

## API Endpoints

### Books
- `GET /api/books` - List all books
- `POST /api/books` - Create a new book
- `GET /api/books/{id}` - Get a specific book

### Reviews
- `GET /api/books/{id}/reviews` - Get all reviews for a book
- `POST /api/books/{id}/reviews` - Add a review for a book

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Redis server (optional - service will work without it)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```

3. **Run database migrations**:
   ```bash
   npm run migration:run
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

### API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI JSON**: http://localhost:3000/api-docs.json

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project
- `npm start` - Start production server
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Database Operations

- `npm run migration:generate -- -n MigrationName` - Generate new migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration
- `npm run schema:drop` - Drop database schema

### Testing

The project includes comprehensive tests:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

Test coverage includes:
- **Unit tests** for API endpoints
- **Integration tests** for cache behavior
- **Error handling** scenarios
- **Data validation** testing

## Architecture

### Project Structure

```
src/
├── config/          # Configuration files
│   ├── database.ts  # TypeORM configuration
│   ├── redis.ts     # Redis/Cache service
│   └── swagger.ts   # API documentation setup
├── controllers/     # Route controllers
├── entities/        # TypeORM entities
├── middleware/      # Express middleware
├── migrations/      # Database migrations
├── routes/          # API routes
└── __tests__/       # Test files
```

### Key Design Decisions

1. **Separation of Concerns**: Controllers handle business logic, services manage external dependencies
2. **Cache Strategy**: Redis with graceful fallback when cache is unavailable
3. **Database Optimization**: Strategic indexing on frequently queried columns
4. **Error Handling**: Centralized error handling with meaningful HTTP status codes
5. **Validation**: Input validation using decorators and class-validator

### Performance Optimizations

1. **Database Indexing**:
   - Index on `reviews.bookId` for efficient book review lookups
   - Composite index on `books(title, author)` for search queries
   - Index on `reviews.rating` for rating-based queries

2. **Caching Strategy**:
   - Cache book lists and individual book details
   - Cache review lists per book
   - Intelligent cache invalidation on data changes

3. **Query Optimization**:
   - Use of relations loading where appropriate
   - Optimized queries with proper WHERE clauses

## API Usage Examples

### Create a Book

```bash
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "978-0-7432-7356-5",
    "publishedYear": 1925,
    "description": "A classic American novel"
  }'
```

### Get All Books

```bash
curl http://localhost:3000/api/books
```

### Add a Review

```bash
curl -X POST http://localhost:3000/api/books/1/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Absolutely brilliant!",
    "reviewerName": "John Doe"
  }'
```

### Get Reviews for a Book

```bash
curl http://localhost:3000/api/books/1/reviews
```

## Cache Behavior

The service implements a sophisticated caching strategy:

1. **Cache Hit**: Data served from Redis (fast response)
2. **Cache Miss**: Data fetched from database and cached
3. **Cache Failure**: Graceful fallback to database with error logging
4. **Cache Invalidation**: Strategic invalidation on data modifications

## Error Handling

The API provides consistent error responses with appropriate HTTP status codes:

- `400`: Bad Request (validation errors)
- `404`: Not Found (resource doesn't exist)
- `409`: Conflict (duplicate ISBN)
- `500`: Internal Server Error (unexpected errors)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with appropriate tests
4. Ensure all tests pass
5. Submit a pull request

## License

This project is part of a technical assessment and is for demonstration purposes.