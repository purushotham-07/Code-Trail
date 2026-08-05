import { Router } from 'express';
import { getCurrentUser, googleLogin, logout } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/google', googleLogin);
router.get('/me', protect, getCurrentUser);
router.post('/logout', protect, logout);

export default router;
