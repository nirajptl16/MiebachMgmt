import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Log time entry (CONTRIBUTOR action)
export const createTimeEntry = async (req: Request, res: Response) => {
  try {
    const { taskId, workDate, hours, isBillable } = req.body;
    const userId = req.user!.userId;

    if (!taskId || !workDate || hours === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: taskId, workDate, hours' 
      });
    }

    // Validate user is assigned to this task
    const assignment = await prisma.taskAssignment.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });

    if (!assignment) {
      return res.status(403).json({ 
        error: 'You are not assigned to this task. Please contact your manager.' 
      });
    }

    // Validate hours
    const hoursNum = parseFloat(hours);
    if (hoursNum <= 0 || hoursNum > 24) {
      return res.status(400).json({ 
        error: 'Hours must be between 0 and 24' 
      });
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        taskId,
        userId,
        workDate: new Date(workDate),
        hours: hoursNum,
        isBillable: isBillable !== undefined ? isBillable : true,
      },
      include: {
        task: {
          include: {
            phase: {
              include: {
                project: true,
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

    res.status(201).json(timeEntry);
  } catch (error) {
    console.error('Create time entry error:', error);
    res.status(500).json({ error: 'Failed to log time' });
  }
};

// Get my time entries (CONTRIBUTOR view)
export const getMyTimeEntries = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { startDate, endDate } = req.query;

    const whereClause: any = { userId };

    if (startDate || endDate) {
      whereClause.workDate = {};
      if (startDate) whereClause.workDate.gte = new Date(startDate as string);
      if (endDate) whereClause.workDate.lte = new Date(endDate as string);
    }

    const entries = await prisma.timeEntry.findMany({
      where: whereClause,
      include: {
        task: {
          include: {
            phase: {
              include: {
                project: true,
              },
            },
          },
        },
      },
      orderBy: {
        workDate: 'desc',
      },
    });

    res.json(entries);
  } catch (error) {
    console.error('Get my time entries error:', error);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
};

// Get time entries for a task (MANAGER view)
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
        workDate: 'desc',
      },
    });

    res.json(entries);
  } catch (error) {
    console.error('Get task time entries error:', error);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
};

// Get time entries for a project (MANAGER view)
export const getProjectTimeEntries = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    const whereClause: any = {
      task: {
        phase: {
          projectId,
        },
      },
    };

    if (startDate || endDate) {
      whereClause.workDate = {};
      if (startDate) whereClause.workDate.gte = new Date(startDate as string);
      if (endDate) whereClause.workDate.lte = new Date(endDate as string);
    }

    const entries = await prisma.timeEntry.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        task: {
          include: {
            phase: true,
          },
        },
      },
      orderBy: {
        workDate: 'desc',
      },
    });

    res.json(entries);
  } catch (error) {
    console.error('Get project time entries error:', error);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
};