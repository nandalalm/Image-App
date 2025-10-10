import axiosInstance from "../api/axiosInstance";
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  OtpVerificationData,
  ForgotPasswordData,
  ResetPasswordData,
  User
} from "../types/auth";

export class AuthApi {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axiosInstance.post("/auth/login", credentials);
    return {
      accessToken: response.data.accessToken,
      user: response.data.user
    };
  }

  static async register(userData: RegisterData): Promise<{ message: string }> {
    const response = await axiosInstance.post("/auth/register", userData);
    return response.data;
  }

  static async verifyOtp(data: OtpVerificationData): Promise<AuthResponse> {
    const response = await axiosInstance.post("/auth/verify-otp", data);
    return {
      accessToken: response.data.accessToken,
      user: response.data.user
    };
  }

  static async resendOtp(email: string): Promise<{ message: string }> {
    const response = await axiosInstance.post("/auth/resend-otp", { email });
    return response.data;
  }

  static async refreshToken(): Promise<{ accessToken: string }> {
    const response = await axiosInstance.get("/auth/refresh-token");
    return response.data;
  }

  static async forgotPassword(data: ForgotPasswordData): Promise<{ message: string }> {
    const response = await axiosInstance.post("/auth/forgot-password", data);
    return response.data;
  }

  static async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    const response = await axiosInstance.post("/auth/reset-password", data);
    return response.data;
  }

  static async logout(): Promise<{ message: string }> {
    const response = await axiosInstance.post("/auth/logout");
    return response.data;
  }

  static async getProfile(): Promise<User> {
    const response = await axiosInstance.get("/auth/home");
    return response.data.user;
  }
}
