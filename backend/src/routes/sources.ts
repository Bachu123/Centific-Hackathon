import { Router } from 'express';
import { requireRole } from '../middleware/auth';
import * as sourcesController from '../controllers/sourcesController';

const router = Router();

// GET /api/sources        — user/admin
router.get('/', sourcesController.list);

// GET /api/sources/:id    — user/admin
router.get('/:id', sourcesController.getById);

// POST /api/sources       — admin only
router.post('/', requireRole('admin'), sourcesController.create);

// PUT /api/sources/:id    — admin only
router.put('/:id', requireRole('admin'), sourcesController.update);

export default router;

