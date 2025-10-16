import express from 'express';
import {
  generateInvoice,
  getInvoices,
  getInvoice,
  getProjectInvoices,
} from '../controllers/invoice.controller';
import { authenticate, requireManager } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate);
router.use(requireManager);

router.post('/generate', generateInvoice);
router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.get('/project/:projectId', getProjectInvoices);

export default router;