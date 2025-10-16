import express from 'express';
import {
  createProject,
  getProjects,
  getProject,
  addStaffing,
  getStaffing,
  addPhase,
  getPhases,
} from '../controllers/project.controller';
import { authenticate, requireManager } from '../middleware/auth.middleware';
import { BudgetService } from '../services/budget';
import { UtilizationService } from '../services/utilization';

const router = express.Router();

router.use(authenticate);

//project
router.post('/', requireManager, createProject);
router.get('/', getProjects);
router.get('/:id', getProject);

//staffing
router.post('/:projectId/staffing', requireManager, addStaffing);
router.get('/:projectId/staffing', getStaffing);

//phases
router.post('/:projectId/phases', requireManager, addPhase);
router.get('/:projectId/phases', getPhases);

//budget on phase level
router.get('/phases/:phaseId/budget', async (req, res) => {
  try {
    const { phaseId } = req.params;
    const budget = await BudgetService.getPhaseBudget(phaseId);
    res.json(budget);
  } catch (error) {
    console.error('Error fetching phase budget:', error);
    res.status(500).json({ error: 'Failed to fetch phase budget' });
  }
});

//budget on project level
router.get('/:id/budget', async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await BudgetService.getProjectBudget(id);
    res.json(budget);
  } catch (error) {
    console.error('Error fetching project budget:', error);
    res.status(500).json({ error: 'Failed to fetch project budget' });
  }
});

//utilization on project level
router.get('/:id/utilization', async (req, res) => {
  try {
    const { id } = req.params;
    const utilization = await UtilizationService.getProjectUtilization(id);
    res.json(utilization);
  } catch (error) {
    console.error('Error fetching project utilization:', error);
    res.status(500).json({ error: 'Failed to fetch project utilization' });
  }
});

export default router;