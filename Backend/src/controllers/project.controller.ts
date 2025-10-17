import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { BudgetService } from '../services/budget';
import { UtilizationService } from '../services/utilization';

const prisma = new PrismaClient();

// Create project
export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, clientName, startDate, endDate } = req.body;

    if (!name || !clientName || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, clientName, startDate, endDate' 
      });
    }

    const project = await prisma.project.create({
      data: {
        name,
        clientName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

// Get all projects (list view)
export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        _count: {
          select: {
            phases: true,
            staffing: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

// Get single project with full details + budget + utilization
export const getProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        staffing: {
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
        phases: {
          include: {
            tasks: {
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
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            startDate: 'asc',
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Calculate budget and utilization
    const budget = await BudgetService.getProjectBudget(id);
    const utilization = await UtilizationService.getProjectUtilization(id);

    res.json({
      ...project,
      budget,
      utilization,
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

// Add project staffing (forecast)
export const addStaffing = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { userId, roleName, hourlyRate, forecastHours } = req.body;

    if (!userId || !roleName || !hourlyRate || !forecastHours) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, roleName, hourlyRate, forecastHours' 
      });
    }

    const staffing = await prisma.projectStaffing.create({
      data: {
        projectId,
        userId,
        roleName,
        hourlyRate: parseFloat(hourlyRate),
        forecastHours: parseFloat(forecastHours),
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
      },
    });

    res.status(201).json(staffing);
  } catch (error: any) {
    console.error('Add staffing error:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'This user is already staffed in this role for this project' 
      });
    }
    
    res.status(500).json({ error: 'Failed to add staffing' });
  }
};

// Get project staffing
export const getStaffing = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const staffing = await prisma.projectStaffing.findMany({
      where: { projectId },
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
    });

    res.json(staffing);
  } catch (error) {
    console.error('Get staffing error:', error);
    res.status(500).json({ error: 'Failed to fetch staffing' });
  }
};

// Add project phase
export const addPhase = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { name, startDate, endDate } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, startDate, endDate' 
      });
    }

    const phase = await prisma.projectPhase.create({
      data: {
        projectId,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    res.status(201).json(phase);
  } catch (error) {
    console.error('Add phase error:', error);
    res.status(500).json({ error: 'Failed to create phase' });
  }
};

// Get project phases
export const getPhases = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const phases = await prisma.projectPhase.findMany({
      where: { projectId },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    res.json(phases);
  } catch (error) {
    console.error('Get phases error:', error);
    res.status(500).json({ error: 'Failed to fetch phases' });
  }
};

