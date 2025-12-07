import { Request, Response, NextFunction } from "express";
import jwt, { VerifyErrors, JwtPayload } from "jsonwebtoken";
import { container } from "../config/container";
import { TYPES } from "../config/types";
import { IUserService } from "../interfaces/services/IAuthService";
import { HttpStatus } from "../constants/httpStatus";
import { Messages } from "../constants/messages";

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

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) return res.status(HttpStatus.BAD_REQUEST).json({ message: Messages.EMAIL_REQUIRED });
    const origin = req.headers.origin || process.env.FRONTEND_BASE_URL;
    
    const result = await userService.requestPasswordReset(email, typeof origin === 'string' ? origin : undefined);
    if (!result.emailExists) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: Messages.EMAIL_NOT_REGISTERED });
    }
    
    return res.status(HttpStatus.OK).json({ message: Messages.RESET_LINK_SENT });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token || !password) return res.status(HttpStatus.BAD_REQUEST).json({ message: Messages.TOKEN_AND_PASSWORD_REQUIRED });
    if (password.length < 6) return res.status(HttpStatus.BAD_REQUEST).json({ message: Messages.PASSWORD_TOO_SHORT });
    await userService.resetPassword(token, password);
    return res.status(HttpStatus.OK).json({ message: Messages.PASSWORD_UPDATED });
  } catch (err) {
    next(err);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    
    const { accessToken, refreshToken, user } = await userService.verifyOTP(email, otp);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(HttpStatus.OK).json({
      accessToken,
      user
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === Messages.OTP_INVALID || err.message === Messages.REGISTRATION_SESSION_EXPIRED) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
      }
    }
    next(err);
  }
};

export const resendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(HttpStatus.BAD_REQUEST).json({ message: Messages.EMAIL_REQUIRED });
    
    await userService.resendOTP(email);
    res.status(HttpStatus.OK).json({ message: Messages.OTP_SEND_SUCCESS });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === Messages.REGISTRATION_SESSION_EXPIRED) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
      }
    }
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
    if (err instanceof Error) {
      if (err.message === Messages.INVALID_CREDENTIALS) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: err.message });
      }
    }
    next(err);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(HttpStatus.UNAUTHORIZED).json({ message: Messages.NO_REFRESH_TOKEN });

    interface CustomJwtPayload extends JwtPayload {
      id: string;
      email: string;
    }
    
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    if (!refreshSecret) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Server configuration error" });
    }
    
    jwt.verify(token, refreshSecret, (err: VerifyErrors | null, decoded: string | JwtPayload | undefined) => {
      if (err) return res.status(HttpStatus.FORBIDDEN).json({ message: Messages.INVALID_REFRESH_TOKEN });

      const payload = decoded as CustomJwtPayload;
      const accessSecret = process.env.ACCESS_TOKEN_SECRET;
      if (!accessSecret) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Server configuration error" });
      }
      
      const accessToken = jwt.sign({ id: payload.id, email: payload.email }, accessSecret, {
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
      message: Messages.WELCOME_HOME, 
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
    
    res.status(HttpStatus.OK).json({ message: Messages.LOGGED_OUT });
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: Messages.UNAUTHORIZED });
    }
    const profile = await userService.getProfile(userId);
    
    if (profile.profileImageUrl) {
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.split(" ")[1];
      if (accessToken) {
        profile.profileImageUrl = `/api/user/profile-image?token=${accessToken}`;
      }
    }
    
    return res.status(HttpStatus.OK).json({ user: profile });
  } catch (err) {
    next(err);
  }
};

export const serveProfileImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let userId: string | undefined;
    const { token } = req.query;

    const authHeader = req.headers.authorization;
    const authToken = authHeader?.split(" ")[1];
    
    if (authToken) {
      try {
        const accessSecret = process.env.ACCESS_TOKEN_SECRET;
        if (!accessSecret) throw new Error("Missing ACCESS_TOKEN_SECRET");
        const decoded = jwt.verify(authToken, accessSecret) as JwtPayload & { id: string };
        userId = decoded.id;
      } catch {
        // JWT verification failed, continue to check query token
      }
    }

    if (!userId && token) {
      try {
        const accessSecret = process.env.ACCESS_TOKEN_SECRET;
        if (!accessSecret) throw new Error("Missing ACCESS_TOKEN_SECRET");
        const decoded = jwt.verify(token as string, accessSecret) as JwtPayload & { id: string };
        userId = decoded.id;
      } catch {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: Messages.UNAUTHORIZED });
      }
    }

    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: Messages.UNAUTHORIZED });
    }

    const profile = await userService.getProfile(userId);
    if (!profile.profileImageUrl) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: "Profile image not found" });
    }

    const urlParts = profile.profileImageUrl.split('/');
    const s3Key = urlParts.slice(3).join('/'); 

    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    
    const awsRegion = process.env.AWS_REGION;
    const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const awsBucketName = process.env.AWS_BUCKET_NAME;
    
    if (!awsRegion || !awsAccessKeyId || !awsSecretAccessKey || !awsBucketName) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "AWS configuration error" });
    }

    const s3Client = new S3Client({
      region: awsRegion,
      credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      },
    });

    const command = new GetObjectCommand({
      Bucket: awsBucketName,
      Key: s3Key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    const fetch = (await import('node-fetch')).default;
    const imageResponse = await fetch(signedUrl);
    
    if (!imageResponse.ok) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: "Profile image not found" });
    }
    
    res.set({
      'Content-Type': imageResponse.headers.get('content-type') || 'image/jpeg',
      'Content-Length': imageResponse.headers.get('content-length') || '',
      'Cache-Control': 'private, max-age=300',
    });
   
    imageResponse.body?.pipe(res);
  } catch (err) {
    next(err);
  }
};

export const updateProfilePhoto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: Messages.UNAUTHORIZED });
    }
    const file = req.file;
    if (!file) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: Messages.NO_IMAGE_PROVIDED });
    }
    const updated = await userService.updateProfileImage(userId, {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
    });
    
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.split(" ")[1];
    if (updated.profileImageUrl && accessToken) {
      updated.profileImageUrl = `/api/user/profile-image?token=${accessToken}`;
    }
    
    return res.status(HttpStatus.OK).json({ user: updated, message: Messages.PROFILE_IMAGE_UPDATED });
  } catch (err) {
    next(err);
  }
};
