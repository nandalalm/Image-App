import { UserDTO } from "../../dtos/userDtos";
import { IUser } from "../../models/userModel";

export interface IUserService {
  register(userData: UserDTO, password: string): Promise<UserDTO>;
  verifyOTP(email: string, otp: string): Promise<{ 
    accessToken: string; 
    refreshToken: string; 
    user: { id: string; firstName: string; lastName?: string; email: string; profileImageUrl?: string | undefined };
  }>;
  resendOTP(email: string): Promise<void>;
  login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }>;
  getUserByEmail(email: string): Promise<IUser | null>;
  getProfile(userId: string): Promise<UserDTO>;
  updateProfileImage(userId: string, file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<UserDTO>;
  requestPasswordReset(email: string, originBaseUrl?: string): Promise<{ emailExists: boolean }>;
  resetPassword(token: string, newPassword: string): Promise<void>;
}
