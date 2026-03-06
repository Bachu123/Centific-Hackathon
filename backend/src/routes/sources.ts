import { Router } from 'express';
import * as sourcesController from '../controllers/sourcesController';

const router = Router();

// GET /api/sources        — any authenticated user
router.get('/', sourcesController.list);

// GET /api/sources/:id    — any authenticated user
router.get('/:id', sourcesController.getById);

// POST /api/sources       — any authenticated user
router.post('/', sourcesController.create);

// PUT /api/sources/:id    — any authenticated user
router.put('/:id', sourcesController.update);

export default router;


