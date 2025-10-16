import { PrismaClient } from '@prisma/client';
import { InvoiceLineItem } from '../types/types';

const prisma = new PrismaClient();

export class InvoiceService {
  /**
   * Generate invoice for a project and billing period
   * Sums billable hours × rate for all tasks within the period
   */
  static async generateInvoice(
    projectId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<{
    invoice: any;
    lineItems: InvoiceLineItem[];
  }> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        phases: {
          include: {
            tasks: {
              include: {
                timeEntries: {
                  where: {
                    workDate: {
                      gte: periodStart,
                      lte: periodEnd,
                    },
                    isBillable: true,
                  },
                  include: {
                    user: true,
                  },
                },
                assignments: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const lineItems: InvoiceLineItem[] = [];
    let totalAmount = 0;

    // Process each task
    for (const phase of project.phases) {
      for (const task of phase.tasks) {
        // Skip tasks with no time entries
        if (task.timeEntries.length === 0) continue;

        // Group hours by user
        const userHours: Record<string, { hours: number; name: string }> = {};
        
        task.timeEntries.forEach(entry => {
          if (!userHours[entry.userId]) {
            userHours[entry.userId] = { hours: 0, name: entry.user.name };
          }
          userHours[entry.userId].hours += Number(entry.hours);
        });

        // Create line items
        Object.entries(userHours).forEach(([userId, data]) => {
          const assignment = task.assignments.find(a => a.userId === userId);
          
          if (assignment && data.hours > 0) {
            const amount = data.hours * Number(assignment.hourlyRate);
            totalAmount += amount;

            lineItems.push({
              taskId: task.id,
              taskTitle: task.title,
              phaseName: phase.name,
              hours: data.hours,
              HourlyRate: assignment.hourlyRate,
              amount,
              userName: data.name,
            });
          }
        });
      }
    }

    // Create invoice record
    const invoice = await prisma.invoice.create({
      data: {
        projectId,
        clientName: project.clientName,
        periodStart,
        periodEnd,
        totalAmount,
      },
    });

    return { invoice, lineItems };
  }

  /**
   * Get invoice by ID with regenerated line items
   */
  static async getInvoiceWithDetails(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { project: true },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Regenerate line items
    const result = await this.generateInvoice(
      invoice.projectId,
      invoice.periodStart,
      invoice.periodEnd
    );

    return {
      invoice,
      lineItems: result.lineItems,
    };
  }
}