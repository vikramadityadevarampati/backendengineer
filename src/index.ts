import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database';
import { initRedis } from './config/redis';
import { setupSwagger } from './config/swagger';
import bookRoutes from './routes/books';
import reviewRoutes from './routes/reviews';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/books', bookRoutes);
app.use('/api/reviews', reviewRoutes);

// Setup Swagger
setupSwagger(app);

// Error handling middleware
app.use(errorHandler);

// Initialize database and Redis, then start server
AppDataSource.initialize()
  .then(async () => {
    console.log('✅ Database connected');
    
    // Initialize Redis (will gracefully handle connection failures)
    await initRedis();
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((error) => {
    console.error('❌ Database initialization error:', error);
    process.exit(1);
  });

export default app;