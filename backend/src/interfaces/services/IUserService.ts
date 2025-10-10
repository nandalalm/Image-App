import { UserDTO } from "../../dtos/userDtos";

export interface IUserService {
  register(userData: UserDTO, password: string): Promise<UserDTO>;
  verifyOTP(email: string, otp: string): Promise<boolean>;
  resendOTP(email: string): Promise<void>;
  login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }>;
  getProfile(userId: string): Promise<UserDTO>;
  updateProfileImage(userId: string, file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<UserDTO>;
  requestPasswordReset(email: string, originBaseUrl?: string): Promise<{ emailExists: boolean }>;
  resetPassword(token: string, newPassword: string): Promise<void>;
}
