import express from 'express';
import { analyzeSnippetCode } from '../controllers/analysisController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/analyze', protect, analyzeSnippetCode);

export default router;
