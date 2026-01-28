import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import multer from 'multer';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import traineeRoutes from './routes/trainee.js';
import challengeRoutes from './routes/challenge.js';
import moduleRoutes from './routes/module.js';
import topicRoutes from './routes/topic.js';
import problemRoutes from './routes/problems.js';
import { verifyToken } from './middlewares/auth.js';
import path from 'path';

const app = express();

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'))); // REMOVED: Using Cloudinary
// app.use(multer().any()); // REMOVED: Conflicts with specific upload routes

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', verifyToken, adminRoutes);
app.use('/api/modules', verifyToken, moduleRoutes);
app.use('/api/topics', verifyToken, topicRoutes);
app.use('/api/problems', verifyToken, problemRoutes);
app.use('/api/trainee', verifyToken, traineeRoutes);
app.use('/api/challenges', verifyToken, challengeRoutes);

export default app;
