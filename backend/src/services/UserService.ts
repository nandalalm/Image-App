import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();
import { IUserService } from "../interfaces/services/IUserService";
import { IUserRepository } from "../interfaces/Repositories/IUserRepository";
import { UserDTO } from "../dtos/userDtos";
import { IUser } from "../models/userModel";
import { generateOTP, sendOTPEmail } from "../utils/generateOtp";
import { setOTP, getOTP, deleteOTP } from "../config/redisClient";
import { createAccessToken, createRefreshToken } from "../utils/jwt";
import { Messages } from "../constants/messages";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { generateResetToken, sendPasswordResetEmail } from "../utils/passwordReset";

export class UserService implements IUserService {
  private _userRepository: IUserRepository;
  private _s3Client: S3Client;

  constructor(userRepository: IUserRepository) {
    this._userRepository = userRepository;
    this._s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async register(userData: UserDTO, password: string): Promise<UserDTO> {
    const existing = await this._userRepository.findByEmail(userData.email);
    if (existing) throw new Error(Messages.USER_EXISTS);

    const hashedPassword = await bcrypt.hash(password, 10);
    const tempUserData = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: hashedPassword,
    };

    await setOTP(`tempUser:${userData.email}`, JSON.stringify(tempUserData), 900);

    const otp = generateOTP();
    await setOTP(`otp:${userData.email}`, otp, 300); 
    await sendOTPEmail(userData.email, otp);

    return userData;
  }

  async verifyOTP(email: string, otp: string): Promise<boolean> {
    const storedOtp = await getOTP(`otp:${email}`);
    if (!storedOtp || storedOtp !== otp) throw new Error(Messages.OTP_INVALID);

    const tempUserDataStr = await getOTP(`tempUser:${email}`);
    if (!tempUserDataStr) throw new Error("Registration session expired. Please register again.");

    const tempUserData = JSON.parse(tempUserDataStr);

    const existing = await this._userRepository.findByEmail(email);
    if (existing) throw new Error(Messages.USER_EXISTS);

    await this._userRepository.createUser(tempUserData as IUser);

    await deleteOTP(`otp:${email}`);
    await deleteOTP(`tempUser:${email}`);
    
    return true;
  }

  async resendOTP(email: string): Promise<void> {
    const tempUserDataStr = await getOTP(`tempUser:${email}`);
    if (!tempUserDataStr) throw new Error("Registration session expired. Please register again.");

    const otp = generateOTP();
    await setOTP(`otp:${email}`, otp, 300);
    await sendOTPEmail(email, otp);
  }

  async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this._userRepository.findByEmail(email);
    if (!user) throw new Error(Messages.INVALID_CREDENTIALS);

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error(Messages.INVALID_CREDENTIALS);

    const accessToken = createAccessToken(user.id, user.email);
    const refreshToken = createRefreshToken(user.id, user.email);

    return { accessToken, refreshToken };
  }

  async getProfile(userId: string): Promise<UserDTO> {
    const user = await this._userRepository.findById(userId);
    if (!user) throw new Error("User not found");
    const dto: UserDTO = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
    };
    return dto;
  }

  private async uploadToS3(file: Buffer, fileName: string, contentType: string): Promise<string> {
    const { AWS_BUCKET_NAME, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
    if (!AWS_BUCKET_NAME || !AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      throw new Error("AWS S3 configuration missing. Please set AWS_BUCKET_NAME, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY");
    }
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2);
    const key = `profiles/${timestamp}-${random}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    });
    await this._s3Client.send(command);
    return `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
  }

  async updateProfileImage(userId: string, file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<UserDTO> {
    const url = await this.uploadToS3(file.buffer, file.originalname, file.mimetype);
    const updated = await this._userRepository.updateProfileImageUrl(userId, url);
    if (!updated) throw new Error("User not found");
    return {
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      profileImageUrl: updated.profileImageUrl,
    };
  }

  async requestPasswordReset(email: string, originBaseUrl?: string): Promise<{ emailExists: boolean }> {
    const user = await this._userRepository.findByEmail(email);
    if (!user) {
      return { emailExists: false };
    }
    const token = generateResetToken();
    const ttlSeconds = 15 * 60; 
    await setOTP(`reset:${token}`, email, ttlSeconds);
    const base = originBaseUrl || process.env.FRONTEND_BASE_URL;
    const link = `${base}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, link);
    return { emailExists: true };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const email = await getOTP(`reset:${token}`);
    if (!email) {
      throw new Error("Invalid or expired reset token");
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await this._userRepository.updatePasswordByEmail(email, hash);
    await deleteOTP(`reset:${token}`);
  }
}
