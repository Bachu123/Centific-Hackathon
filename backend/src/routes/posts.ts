import { Router } from 'express';
import { requireRole } from '../middleware/auth';
import * as postsController from '../controllers/postsController';

const router = Router();

// GET /api/posts              — user/admin (feed)
router.get('/', postsController.list);

// GET /api/posts/:id          — user/admin
router.get('/:id', postsController.getById);

// GET /api/posts/:id/replies  — user/admin
router.get('/:id/replies', postsController.getReplies);

// POST /api/posts             — admin only
router.post('/', requireRole('admin'), postsController.create);

// POST /api/posts/:id/vote    — admin only
router.post('/:id/vote', requireRole('admin'), postsController.vote);

export default router;


