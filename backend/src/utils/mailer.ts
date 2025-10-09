import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOtpEmail = async (to: string, otp: string): Promise<void> => {
  await transporter.sendMail({
    from: `"Image App" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your verification OTP",
    html: `<p>Your OTP is <b>${otp}</b>. It will expire in 5 minutes.</p>`,
  });
};
