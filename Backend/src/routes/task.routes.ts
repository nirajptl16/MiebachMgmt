import express from 'express';
import {
  createTask,
  getTask,
  assignTask,
  updateTaskStatus,
  getMyTasks,
  getPhaseTasks,
} from '../controllers/task.controller';
import { authenticate, requireManager } from '../middleware/auth.middleware';
import { BudgetService } from '../services/budget';

const router = express.Router();

router.use(authenticate);

router.post('/', requireManager, createTask);
router.get('/my-tasks', getMyTasks);
router.get('/phase/:phaseId', getPhaseTasks);
router.get('/:id', getTask);
router.post('/:taskId/assign', requireManager, assignTask);
router.patch('/:id/status', updateTaskStatus);


export default router;