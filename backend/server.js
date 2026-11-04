import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, isDBConnected } from './config/db.js';
import { initSocketServer } from './services/socketService.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import opportunityRoutes from './routes/opportunityRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from backend directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow frontend Vite dev server (or configured domain)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logging for debugging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check route
app.get('/api/health', (req, res) => {
  const connected = isDBConnected();
  const hasPasswordPlaceholder = (process.env.MONGO_URI || '').includes('<db_password>');

  res.status(200).json({
    status: 'ok',
    database: connected ? 'connected' : hasPasswordPlaceholder ? 'awaiting_password' : 'disconnected',
    databaseName: process.env.DB_NAME || 'scholarconnect',
    instruction: hasPasswordPlaceholder
      ? 'Please replace <db_password> with your Atlas password in backend/.env'
      : undefined,
    timestamp: new Date().toISOString(),
    service: 'ScholarConnect Backend API (Node.js + Official MongoDB Driver)',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/verifications', verificationRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('ScholarConnect API Server is running.');
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server and Connect Database
export async function startServer() {
  const httpServer = http.createServer(app);

  // Initialize Socket.IO Server with JWT authentication & events
  initSocketServer(httpServer);

  httpServer.listen(PORT, () => {
    console.log('====================================================');
    console.log(` ScholarConnect API & Socket.IO Server on port ${PORT}`);
    console.log(` Health check available at: http://localhost:${PORT}/api/health`);
    console.log('====================================================');
  });

  try {
    await connectDB();
  } catch (dbError) {
    console.warn('MongoDB initial connection attempt:', dbError.message);
  }
}

// In standard Node.js environments (local dev or persistent servers like Render/Railway), start HTTP server
if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;
