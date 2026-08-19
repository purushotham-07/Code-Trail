import express from 'express';
import { analyzeSnippetCode, translatePolyglot } from '../controllers/analysisController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/analyze', protect, analyzeSnippetCode);
router.post('/translate', protect, translatePolyglot);

export default router;
