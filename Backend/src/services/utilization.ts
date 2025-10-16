import { PrismaClient } from '@prisma/client';
import { UtilizationData } from '../types/types';

const prisma = new PrismaClient();

export class UtilizationService {
  /**
   * Calculate utilization for all people on a project
   * utilization = actual_logged_hours / staffed_forecast_hours
   */
  static async getProjectUtilization(projectId: string): Promise<UtilizationData[]> {
    const staffing = await prisma.projectStaffing.findMany({
      where: { projectId },
      include: { user: true },
    });

    // Get all time entries for this project
    const phases = await prisma.projectPhase.findMany({
      where: { projectId },
      include: {
        tasks: {
          include: {
            timeEntries: true,
          },
        },
      },
    });

    // Calculate actual hours per user
    const actualHoursMap: Record<string, number> = {};
    for (const phase of phases) {
      for (const task of phase.tasks) {
        for (const entry of task.timeEntries) {
          actualHoursMap[entry.userId] = (actualHoursMap[entry.userId] || 0) + Number(entry.hours);
        }
      }
    }

    // Build utilization data
    return staffing.map(s => {
      const actualHours = actualHoursMap[s.userId] || 0;
      const forecastHours = Number(s.forecastHours);
      const utilization = forecastHours > 0
        ? (actualHours / forecastHours) * 100
        : 0;

      return {
        userId: s.userId,
        userName: s.user.name,
        roleName: s.roleName,
        forecastHours,
        actualHours,
        totalHours: forecastHours, // totalHours should be forecastHours (planned)
        utilization: Math.round(utilization * 100) / 100,
      };
    });
  }

  /**
   * Calculate utilization for a specific user across all projects
   */
  static async getUserUtilization(userId: string): Promise<{
    totalForecast: number;
    totalActual: number;
    utilization: number;
    projects: Array<{
      projectId: string;
      projectName: string;
      forecastHours: number;
      actualHours: number;
      utilization: number;
    }>;
  }> {
    const staffing = await prisma.projectStaffing.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            phases: {
              include: {
                tasks: {
                  include: {
                    timeEntries: {
                      where: { userId },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    let totalForecast = 0;
    let totalActual = 0;
    const projects = [];

    for (const staff of staffing) {
      const forecastHours = Number(staff.forecastHours);
      totalForecast += forecastHours;

      let actualHours = 0;
      for (const phase of staff.project.phases) {
        for (const task of phase.tasks) {
          actualHours += task.timeEntries.reduce((sum, e) => sum + Number(e.hours), 0);
        }
      }

      totalActual += actualHours;

      projects.push({
        projectId: staff.projectId,
        projectName: staff.project.name,
        forecastHours,
        actualHours,
        utilization: forecastHours > 0 
          ? Math.round((actualHours / forecastHours) * 100 * 100) / 100
          : 0,
      });
    }

    const utilization = totalForecast > 0 
      ? Math.round((totalActual / totalForecast) * 100 * 100) / 100
      : 0;

    return {
      totalForecast,
      totalActual,
      utilization,
      projects,
    };
  }
}