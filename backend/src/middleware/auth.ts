import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticate = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ error: "Token is not valid" });
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: "You are not authenticated" });
  }
};

export const authorize = (roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You don't have permission to perform this action" });
    }
    next();
  };
};
