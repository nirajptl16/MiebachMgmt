import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { BudgetService } from '../services/budget';

const prisma = new PrismaClient();

// Create task
export const createTask = async (req: Request, res: Response) => {
  try {
    const { phaseId, title, description, startDate, endDate, dueDate, budget } = req.body;

    if (!phaseId || !title || !startDate || !endDate || !dueDate || budget === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: phaseId, title, startDate, endDate, dueDate, budget' 
      });
    }

    const task = await prisma.task.create({
      data: {
        phaseId,
        title,
        description: description || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        dueDate: new Date(dueDate),
        budget: parseFloat(budget),
        status: 'TODO',
      },
      include: {
        phase: {
          include: {
            project: true,
          },
        },
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

// Get task with budget details
export const getTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        phase: {
          include: {
            project: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        timeEntries: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            workDate: 'desc',
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Add budget summary
    const budgetSummary = await BudgetService.getTaskBudget(id);

    res.json({
      ...task,
      budgetSummary,
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};

// Assign user to task
export const assignTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { userId, hourlyRate } = req.body;

    if (!userId || hourlyRate === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, hourlyRate' 
      });
    }

    const assignment = await prisma.taskAssignment.create({
      data: {
        taskId,
        userId,
        hourlyRate: parseFloat(hourlyRate),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        task: {
          include: {
            phase: true,
          },
        },
      },
    });

    res.status(201).json(assignment);
  } catch (error: any) {
    console.error('Assign task error:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'This user is already assigned to this task' 
      });
    }
    
    res.status(500).json({ error: 'Failed to assign task' });
  }
};

// Update task status
export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const task = await prisma.task.update({
      where: { id },
      data: { status },
    });

    res.json(task);
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
};

// Get tasks assigned to current user (CONTRIBUTOR view)
export const getMyTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const assignments = await prisma.taskAssignment.findMany({
      where: { userId },
      include: {
        task: {
          include: {
            phase: {
              include: {
                project: true,
              },
            },
            assignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        task: {
          dueDate: 'asc',
        },
      },
    });

    const tasks = assignments.map(a => ({
      ...a.task,
      myHourlyRate: a.hourlyRate,
    }));

    res.json(tasks);
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// Get all tasks for a phase
export const getPhaseTasks = async (req: Request, res: Response) => {
  try {
    const { phaseId } = req.params;

    const tasks = await prisma.task.findMany({
      where: { phaseId },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            timeEntries: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    res.json(tasks);
  } catch (error) {
    console.error('Get phase tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};