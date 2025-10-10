import { Request, Response, NextFunction } from "express";
import { HttpStatus } from "../constants/httpStatus";
import { logError } from "./loggerMiddleware";

export const errorMiddleware = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  console.error(err.stack);
  logError(err, req);
  
  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: err.message });
};
