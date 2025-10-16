import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../types/types';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// Verify JWT token and attach user to request
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader  || !authHeader.startsWith('Bearer ')) {

      res.status(401).json({ error: 'Authorization header missing or invalid' });
      return;
    }
      
    
    if (!process.env.JWT_SECRET) {
      res.status(500).json({ error: 'JWT_SECRET not configured on server' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to check for MANAGER role for protected routes
export const requireManager = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'MANAGER') {
    return res.status(403).json({ error: 'Manager role required' });
  }
  next();
};