export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  profileImageUrl?: string;
}

export interface AuthResponse {
  accessToken: string;
  user?: User;
}

export interface OtpVerificationData {
  email: string;
  otp: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}
