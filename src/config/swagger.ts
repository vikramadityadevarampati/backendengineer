import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Book Review Service API',
      version: '1.0.0',
      description: 'A RESTful API for managing books and reviews',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Book: {
          type: 'object',
          required: ['title', 'author', 'isbn'],
          properties: {
            id: {
              type: 'integer',
              description: 'The auto-generated ID of the book',
            },
            title: {
              type: 'string',
              description: 'The title of the book',
            },
            author: {
              type: 'string',
              description: 'The author of the book',
            },
            isbn: {
              type: 'string',
              description: 'The ISBN of the book',
            },
            publishedYear: {
              type: 'integer',
              description: 'The year the book was published',
            },
            description: {
              type: 'string',
              description: 'A brief description of the book',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Review: {
          type: 'object',
          required: ['rating', 'comment'],
          properties: {
            id: {
              type: 'integer',
              description: 'The auto-generated ID of the review',
            },
            rating: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              description: 'Rating from 1 to 5',
            },
            comment: {
              type: 'string',
              description: 'Review comment',
            },
            reviewerName: {
              type: 'string',
              description: 'Name of the reviewer',
            },
            bookId: {
              type: 'integer',
              description: 'ID of the book being reviewed',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            details: {
              type: 'string',
              description: 'Additional error details',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};