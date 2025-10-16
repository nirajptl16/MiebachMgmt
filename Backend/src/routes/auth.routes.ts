import express from 'express';
import { login, me, getAllUsers } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import {UtilizationService} from '../services/utilization';

const router = express.Router();

router.post('/login', login);
router.get('/me', authenticate, me);
router.get('/users', authenticate, getAllUsers);

// Add user utilization endpoint
router.get('/users/:userId/utilization', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const utilization = await UtilizationService.getUserUtilization(userId);
    res.json(utilization);
  } catch (error) {
    console.error('Error fetching user utilization:', error);
    res.status(500).json({ error: 'Failed to fetch user utilization' });
  }
});


export default router;