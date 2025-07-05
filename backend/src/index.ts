import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import classroomRoutes from './routes/classrooms';
import postRoutes from './routes/posts';
import searchRoutes from './routes/search';
import uploadRoutes from './routes/upload';
import filesRoutes from './routes/files';
import categoriesRoutes from './routes/categories';
import apiKeyRoutes from './routes/apiKey';
import ragRoutes from './routes/rag';

// Config
import { corsOptions } from './config/cors';
import { setupSocketIO } from './config/socket';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});

// Initialize Prisma
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

// Trust proxy (for deployment behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Favicon handler
app.get('/favicon.ico', (req, res) => {
  res.status(204).send();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/apikey', apiKeyRoutes);
app.use('/api/rag', ragRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Database status
app.get('/db-status', async (req, res) => {
  try {
    await prisma.$connect();
    
    const [userCount, classroomCount, postCount] = await Promise.all([
      prisma.user.count(),
      prisma.classroom.count(),
      prisma.post.count(),
    ]);

    res.json({
      status: 'Connected',
      database: process.env.DATABASE_URL?.includes('postgresql') ? 'PostgreSQL' : 'SQLite',
      timestamp: new Date().toISOString(),
      statistics: {
        users: userCount,
        classrooms: classroomCount,
        posts: postCount,
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      status: 'Error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await prisma.$disconnect();
  }
});

// Socket.IO setup
setupSocketIO(io);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 OpenClass Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Frontend: http://localhost:3000`);
  console.log(`🔗 Backend: http://localhost:${PORT}`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/health`);
  console.log(`📊 DB Status: http://localhost:${PORT}/db-status`);
});

export default app;
export { prisma, io };
