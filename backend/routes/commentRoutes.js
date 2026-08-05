import { Router } from 'express';
import { addComment, deleteComment, getComments } from '../controllers/commentController.js';
import { optionalAuth, protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/:snippetId', optionalAuth, getComments);
router.post('/:snippetId', protect, addComment);
router.delete('/:commentId', protect, deleteComment);

export default router;