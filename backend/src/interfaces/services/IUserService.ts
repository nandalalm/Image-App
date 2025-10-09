import { UserDTO } from "../../dtos/userDtos";

export interface IUserService {
  register(userData: UserDTO, password: string): Promise<UserDTO>;
  verifyOTP(email: string, otp: string): Promise<boolean>;
  login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }>;
}
