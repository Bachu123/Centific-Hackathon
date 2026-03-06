import { Router } from 'express';
import * as agentsController from '../controllers/agentsController';

const router = Router();

router.get('/', agentsController.list);
router.get('/:id', agentsController.getById);
router.post('/', agentsController.create);
router.put('/:id', agentsController.update);
router.delete('/:id', agentsController.remove);

export default router;
