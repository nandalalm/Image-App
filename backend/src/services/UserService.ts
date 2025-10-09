import bcrypt from "bcryptjs";
import { IUserService } from "../interfaces/services/IUserService";
import { IUserRepository } from "../interfaces/Repositories/IUserRepository";
import { UserDTO } from "../dtos/userDtos";
import { IUser } from "../models/userModel";
import { generateOTP, sendOTPEmail } from "../utils/generateOtp";
import { setOTP, getOTP, deleteOTP } from "../config/redisClient";
import { createAccessToken, createRefreshToken } from "../utils/jwt";
import { Messages } from "../constants/messages";

export class UserService implements IUserService {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async register(userData: UserDTO, password: string): Promise<UserDTO> {
    const existing = await this.userRepository.findByEmail(userData.email);
    if (existing) throw new Error(Messages.USER_EXISTS);

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: hashedPassword,
    };
    await this.userRepository.createUser(newUser as IUser);

    const otp = generateOTP();
    await setOTP(`otp:${userData.email}`, otp, 300);
    await sendOTPEmail(userData.email, otp);

    return userData;
  }

  async verifyOTP(email: string, otp: string): Promise<boolean> {
    const storedOtp = await getOTP(`otp:${email}`);
    if (!storedOtp || storedOtp !== otp) throw new Error(Messages.OTP_INVALID);

    await deleteOTP(`otp:${email}`);
    return true;
  }

  async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error(Messages.INVALID_CREDENTIALS);

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error(Messages.INVALID_CREDENTIALS);

    const accessToken = createAccessToken(user.id, user.email);
    const refreshToken = createRefreshToken(user.id, user.email);

    return { accessToken, refreshToken };
  }
}
