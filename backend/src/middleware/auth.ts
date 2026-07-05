import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? 'dev-secret') as {
      sub: string;
    };

    req.user = {
      id: decoded.sub,
      email: '',
      name: ''
    };

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
