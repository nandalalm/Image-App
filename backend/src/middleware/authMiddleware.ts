import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { HttpStatus } from "../constants/httpStatus";

interface AuthenticatedUser {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    res.status(HttpStatus.UNAUTHORIZED).json({ message: "Unauthorized" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as JwtPayload & AuthenticatedUser;
    req.user = {
      id: decoded.id,
      email: decoded.email
    };
    next();
  } catch {
    res.status(HttpStatus.FORBIDDEN).json({ message: "Token invalid or expired" });
  }
};
