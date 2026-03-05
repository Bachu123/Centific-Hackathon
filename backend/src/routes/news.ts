import { Router } from 'express';
import { requireRole } from '../middleware/auth';
import * as newsController from '../controllers/newsController';

const router = Router();

// GET /api/news        — user/admin
router.get('/', newsController.list);

// GET /api/news/:id    — user/admin
router.get('/:id', newsController.getById);

// POST /api/news       — admin only (ingestion from scouts/n8n)
router.post('/', requireRole('admin'), newsController.ingest);

export default router;


