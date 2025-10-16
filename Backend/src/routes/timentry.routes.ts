import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createTimeEntry,
  getTaskTimeEntries,
  getMyTimeEntries,
  updateTimeEntry,
  deleteTimeEntry,
  getTaskBudget,
} from '../controllers/timentry.controller';

const router = Router();

// All routes require authentication
router.post('/', authenticate, createTimeEntry);
router.get('/my-entries', authenticate, getMyTimeEntries);
router.get('/task/:taskId/budget', authenticate, getTaskBudget);
router.get('/task/:taskId', authenticate, getTaskTimeEntries);
router.put('/:entryId', authenticate, updateTimeEntry);
router.delete('/:entryId', authenticate, deleteTimeEntry);

export default router;