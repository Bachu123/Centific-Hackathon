import { Router } from 'express';
import * as reportsController from '../controllers/reportsController';

const router = Router();

// GET /api/reports          — user/admin
router.get('/', reportsController.list);

// GET /api/reports/:date    — user/admin
router.get('/:date', reportsController.getByDate);

export default router;


