import { Router } from 'express';
import { requireRole } from '../middleware/auth';
import * as agentsController from '../controllers/agentsController';

const router = Router();

// GET /api/agents          — user/admin
router.get('/', agentsController.list);

// GET /api/agents/:id      — user/admin
router.get('/:id', agentsController.getById);

// POST /api/agents         — admin only
router.post('/', requireRole('admin'), agentsController.create);

// PUT /api/agents/:id      — admin only
router.put('/:id', requireRole('admin'), agentsController.update);

// DELETE /api/agents/:id   — admin only
router.delete('/:id', requireRole('admin'), agentsController.remove);

export default router;

