import { Router } from 'express';
import { body } from 'express-validator';
import {
    createSnippet,
    deleteSnippet,
    editSnippet,
    forkSnippet,
    getPublicSnippets,
    getSnippet,
    getUserSnippets,
    restoreVersion,
} from '../controllers/snippetController.js';
import { optionalAuth, protect } from '../middleware/authMiddleware.js';

const router = Router();

const snippetValidators = [
  body('title').optional().trim().isLength({ max: 200 }).withMessage('Title must be at most 200 characters'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description must be at most 2000 characters'),
  body('commitMessage').optional().trim().isLength({ max: 200 }).withMessage('Version name must be at most 200 characters'),
];

router.get('/public', getPublicSnippets);
router.get('/user', protect, getUserSnippets);
router.get('/:id', optionalAuth, getSnippet);

router.post('/', protect, snippetValidators, createSnippet);
router.put('/:id', protect, snippetValidators, editSnippet);
router.delete('/:id', protect, deleteSnippet);
router.post('/:id/fork', protect, forkSnippet);
router.post('/:id/restore/:versionNumber', protect, restoreVersion);

export default router;