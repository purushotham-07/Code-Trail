import { Router } from 'express';
import { compareVersions, getVersionByNumber, getVersionHistory } from '../controllers/versionController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/:snippetId/history', optionalAuth, getVersionHistory);
router.get('/:snippetId/version/:versionNumber', optionalAuth, getVersionByNumber);
router.get('/:snippetId/compare/:baseVersion/:compareVersion', optionalAuth, compareVersions);

export default router;