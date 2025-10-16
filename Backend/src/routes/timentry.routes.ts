import express from 'express';
import {
  createTimeEntry,
  getMyTimeEntries,
  getTaskTimeEntries,
  getProjectTimeEntries,
} from '../controllers/timentry.controller';
import { authenticate, requireManager } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate);

router.post('/', createTimeEntry);
router.get('/my-entries', getMyTimeEntries);
router.get('/task/:taskId', getTaskTimeEntries);
router.get('/project/:projectId', requireManager, getProjectTimeEntries);

export default router;