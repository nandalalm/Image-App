import { createContext } from "react";

export type Toast = {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
};

export type ToastContextType = {
  show: (message: string, type?: Toast["type"], durationMs?: number) => void;
};

export const ToastContext = createContext<ToastContextType | null>(null);
