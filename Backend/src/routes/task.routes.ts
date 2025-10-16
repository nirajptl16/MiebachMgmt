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

router.get('/:id/budget', async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await BudgetService.getTaskBudget(id);
    res.json(budget);
  } catch (error) {
    console.error('Error fetching task budget:', error);
    res.status(500).json({ error: 'Failed to fetch task budget' });
  }
});


export default router;