import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware: verifies JWT from Authorization header.
 * Attaches decoded payload to req.user on success.
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = header.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware: validates X-Scout-Key header for service-to-service calls
 * from the AI engine. No JWT required.
 */
export const scoutAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const key = req.headers['x-scout-key'] as string | undefined;
  const expected = process.env.SCOUT_API_KEY;

  if (!expected) {
    res.status(500).json({ error: 'SCOUT_API_KEY not configured on server' });
    return;
  }

  if (!key || key !== expected) {
    res.status(401).json({ error: 'Invalid or missing scout API key' });
    return;
  }

  next();
};

/**
 * Middleware factory: checks that the authenticated user has one of the
 * specified roles.  Must be used after `authenticate`.
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
};


