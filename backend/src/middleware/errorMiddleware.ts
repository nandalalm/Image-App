import { Request, Response, NextFunction } from "express";
import { HttpStatus } from "../constants/httpStatus";

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error(err.stack);
  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: err.message });
};
