import { Router } from 'express';
import { searchPublicSnippets } from '../controllers/searchController.js';

const router = Router();

router.get('/public', searchPublicSnippets);

export default router;
