import morgan from "morgan";
import type { Request, Response, RequestHandler } from "express";
import fs from "fs";
import path from "path";

const format: morgan.FormatFn | string =
  process.env.NODE_ENV === "production" ? "combined" : "dev";

const skip: (req: Request, res: Response) => boolean = (req: Request, _res: Response) => {
  const noisyPaths = ["/health", "/favicon.ico"];
  return noisyPaths.includes(req.path);
};

const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const dateStr = new Date().toISOString().slice(0, 10); 
const accessLogPath = path.join(logsDir, `access-${dateStr}.log`);
const errorLogPath = path.join(logsDir, `error-${dateStr}.log`);

const accessLogStream = fs.createWriteStream(accessLogPath, { flags: "a" });
const errorLogStream = fs.createWriteStream(errorLogPath, { flags: "a" });

const fileLogger = morgan(format, { skip, stream: accessLogStream });

export const logError = (error: Error, req?: Request, additionalInfo?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  const errorLog = {
    timestamp,
    level: "ERROR",
    message: error.message,
    stack: error.stack,
    url: req?.url,
    method: req?.method,
    ip: req?.ip,
    userAgent: req?.get("User-Agent"),
    additionalInfo
  };
  
  errorLogStream.write(JSON.stringify(errorLog) + "\n");
};

export const logInfo = (message: string, additionalInfo?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  const infoLog = {
    timestamp,
    level: "INFO",
    message,
    additionalInfo
  };
  
  errorLogStream.write(JSON.stringify(infoLog) + "\n");
};

export const logWarning = (message: string, additionalInfo?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  const warningLog = {
    timestamp,
    level: "WARNING",
    message,
    additionalInfo
  };
  
  errorLogStream.write(JSON.stringify(warningLog) + "\n");
};

export const loggerMiddleware: RequestHandler = (req, res, next) => {
  fileLogger(req, res, next);
};
