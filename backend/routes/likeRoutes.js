import { Router } from 'express';
import { getLikeStatus, likeSnippet, unlikeSnippet } from '../controllers/likeController.js';
import { optionalAuth, protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/:snippetId', optionalAuth, getLikeStatus);
router.post('/:snippetId', protect, likeSnippet);
router.delete('/:snippetId', protect, unlikeSnippet);

export default router;