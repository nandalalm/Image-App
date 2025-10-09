import { Request, Response, NextFunction } from "express";
import jwt, { VerifyErrors, JwtPayload } from "jsonwebtoken";
import { container } from "../config/container";
import { TYPES } from "../types/symbols";
import { IUserService } from "../interfaces/services/IUserService";
import { HttpStatus } from "../constants/httpStatus";

const userService = container.get<IUserService>(TYPES.UserService);

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const result = await userService.register({ firstName, lastName, email }, password);
    res.status(HttpStatus.CREATED).json(result);
  } catch (err) {
    next(err);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    await userService.verifyOTP(email, otp);
    res.status(HttpStatus.OK).json({ message: "OTP verified successfully" });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken } = await userService.login(email, password);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(HttpStatus.OK).json({ accessToken });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(HttpStatus.UNAUTHORIZED).json({ message: "No refresh token found" });

    interface CustomJwtPayload extends JwtPayload {
      id: string;
      email: string;
    }
    
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!, (err: VerifyErrors | null, decoded: string | JwtPayload | undefined) => {
      if (err) return res.status(HttpStatus.FORBIDDEN).json({ message: "Invalid refresh token" });

      const payload = decoded as CustomJwtPayload;
      const accessToken = jwt.sign({ id: payload.id, email: payload.email }, process.env.ACCESS_TOKEN_SECRET!, {
        expiresIn: "15m",
      });

      return res.status(HttpStatus.OK).json({ accessToken });
    });
  } catch (err) {
    next(err);
  }
};

export const getHome = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    res.status(HttpStatus.OK).json({ 
      message: "Welcome to Home", 
      user: {
        id: user?.id,
        email: user?.email
      }
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    
    res.status(HttpStatus.OK).json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};
