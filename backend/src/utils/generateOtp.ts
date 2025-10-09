import nodemailer from "nodemailer";

export const generateOTP = (): string => Math.floor(100000 + Math.random() * 900000).toString();

export const sendOTPEmail = async (to: string, otp: string): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "Your OTP Code",
    text: `Your verification code is ${otp}. It expires in 5 minutes.`,
  });
};
