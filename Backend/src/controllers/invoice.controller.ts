import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { InvoiceService } from '../services/invoice';

const prisma = new PrismaClient();

// Generate invoice (MANAGER action)
export const generateInvoice = async (req: Request, res: Response) => {
  try {
    const { projectId, periodStart, periodEnd } = req.body;

    if (!projectId || !periodStart || !periodEnd) {
      return res.status(400).json({ 
        error: 'Missing required fields: projectId, periodStart, periodEnd' 
      });
    }

    const result = await InvoiceService.generateInvoice(
      projectId,
      new Date(periodStart),
      new Date(periodEnd)
    );

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Generate invoice error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate invoice' });
  }
};

// Get all invoices
export const getInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        project: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

// Get invoice by ID with line items
export const getInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await InvoiceService.getInvoiceWithDetails(id);

    res.json(result);
  } catch (error: any) {
    console.error('Get invoice error:', error);
    
    if (error.message === 'Invoice not found') {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

// Get invoices for a project
export const getProjectInvoices = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const invoices = await prisma.invoice.findMany({
      where: { projectId },
      orderBy: {
        periodStart: 'desc',
      },
    });

    res.json(invoices);
  } catch (error) {
    console.error('Get project invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};