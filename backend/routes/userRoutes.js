import { Router } from 'express';
import {
  getProfileStats,
  getPublicProfile,
  getPublicProfileStats,
  getRecentActivity,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/me/stats', protect, getProfileStats);
router.get('/me/activity', protect, getRecentActivity);
router.get('/:userId', getPublicProfile);
router.get('/:userId/stats', getPublicProfileStats);

export default router;