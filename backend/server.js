import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'mongo-sanitize';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import analysisRoutes from './routes/analysisRoutes.js';
import authRoutes from './routes/authRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import likeRoutes from './routes/likeRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import snippetRoutes from './routes/snippetRoutes.js';
import userRoutes from './routes/userRoutes.js';
import versionRoutes from './routes/versionRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false }));

// Strip MongoDB query operators ($, .) from all incoming request bodies to
// prevent NoSQL injection attacks.
app.use((req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = mongoSanitize(req.body);
  }
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/analysis', analysisRoutes);

const start = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`CodeTrail backend listening on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();