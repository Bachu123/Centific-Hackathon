import { Router } from 'express';
import * as activityController from '../controllers/activityController';

const router = Router();

// GET /api/activity — admin only (requireRole applied at app level)
router.get('/', activityController.list);

export default router;


