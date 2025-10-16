import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to convert Decimal fields
const convertTimeEntryDecimals = (entry: any) => ({
  ...entry,
  hours: entry.hours ? Number(entry.hours.toNumber()) : 0,
});

// Create a time entry
export const createTimeEntry = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { taskId, date, hours, isBillable } = req.body; // ← Changed from workDate to date

    console.log('📝 Creating time entry:', { userId, taskId, date, hours, isBillable });

    // Validate required fields
    if (!taskId || !date || hours === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: taskId, date, hours',
        received: { taskId, date, hours, isBillable }
      });
    }

    // Validate hours is a valid number
    const parsedHours = parseFloat(hours);
    if (isNaN(parsedHours) || parsedHours <= 0) {
      return res.status(400).json({ error: 'Hours must be a positive number' });
    }

    // Verify user is assigned to this task
    const assignment = await prisma.taskAssignment.findFirst({
      where: {
        taskId,
        userId,
      },
    });

    if (!assignment) {
      return res.status(403).json({ error: 'You are not assigned to this task' });
    }

    // Create the time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        taskId,
        userId,
        date: new Date(date), // ← Use date field
        hours: parsedHours,
        isBillable: isBillable !== undefined ? isBillable : true,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            phase: {
              select: {
                id: true,
                name: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log('✅ Time entry created:', timeEntry.id);
    res.status(201).json(convertTimeEntryDecimals(timeEntry));
  } catch (error: any) {
    console.error('❌ Create time entry error:', error);
    res.status(500).json({ 
      error: 'Failed to create time entry',
      details: error.message 
    });
  }
};

// Get time entries for a task
export const getTaskTimeEntries = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const entries = await prisma.timeEntry.findMany({
      where: { taskId },
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
        date: 'desc',
      },
    });

    const converted = entries.map(convertTimeEntryDecimals);
    res.json(converted);
  } catch (error) {
    console.error('Get task time entries error:', error);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
};

// Get my time entries
export const getMyTimeEntries = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const entries = await prisma.timeEntry.findMany({
      where: { userId },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            phase: {
              select: {
                id: true,
                name: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    const converted = entries.map(convertTimeEntryDecimals);
    res.json(converted);
  } catch (error) {
    console.error('Get my time entries error:', error);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
};

// Update time entry
export const updateTimeEntry = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { entryId } = req.params;
    const { date, hours, isBillable } = req.body;

    // Verify ownership
    const entry = await prisma.timeEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry || entry.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updateData: any = {};
    if (date) updateData.date = new Date(date);
    if (hours !== undefined) updateData.hours = parseFloat(hours);
    if (isBillable !== undefined) updateData.isBillable = isBillable;

    const updated = await prisma.timeEntry.update({
      where: { id: entryId },
      data: updateData,
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(convertTimeEntryDecimals(updated));
  } catch (error) {
    console.error('Update time entry error:', error);
    res.status(500).json({ error: 'Failed to update time entry' });
  }
};

// Delete time entry
export const deleteTimeEntry = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { entryId } = req.params;

    // Verify ownership
    const entry = await prisma.timeEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry || entry.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.timeEntry.delete({
      where: { id: entryId },
    });

    res.json({ message: 'Time entry deleted successfully' });
  } catch (error) {
    console.error('Delete time entry error:', error);
    res.status(500).json({ error: 'Failed to delete time entry' });
  }
};

// Get task budget summary
export const getTaskBudget = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignments: true,
        timeEntries: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Calculate consumed budget
    let totalConsumed = 0;
    for (const entry of task.timeEntries) {
      const assignment = task.assignments.find(a => a.userId === entry.userId);
      if (assignment) {
        const hours = entry.hours.toNumber();
        const rate = assignment.hourlyRate.toNumber();
        totalConsumed += hours * rate;
      }
    }

    const budget = task.budget.toNumber();
    const remaining = budget - totalConsumed;

    res.json({
      taskId: task.id,
      taskTitle: task.title,
      budget,
      consumed: totalConsumed,
      remaining,
      percentUsed: budget > 0 ? (totalConsumed / budget) * 100 : 0,
    });
  } catch (error) {
    console.error('Get task budget error:', error);
    res.status(500).json({ error: 'Failed to fetch task budget' });
  }
};