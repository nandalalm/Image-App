import crypto from "crypto";
import nodemailer from "nodemailer";

export const generateResetToken = (): string => crypto.randomBytes(32).toString("hex");

export const sendPasswordResetEmail = async (to: string, resetLink: string): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color:rgb(8, 131, 232);
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background-color: rgb(8, 131, 232);
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .message {
          font-size: 16px;
          color: #333333;
          margin-bottom: 30px;
          line-height: 1.6;
        }
        .reset-button {
          display: inline-block;
          background-color:rgb(8, 131, 232);
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 4px;
          font-weight: 500;
          font-size: 16px;
          text-align: center;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .expiry-notice {
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 16px;
          margin: 30px 0;
          text-align: center;
        }
        .expiry-notice p {
          color: #6c757d;
          font-size: 14px;
          margin: 0;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px 30px;
          text-align: center;
          border-top: 1px solid #dee2e6;
        }
        .footer p {
          color: #6c757d;
          font-size: 14px;
          margin: 0;
        }
        @media (max-width: 600px) {
          .container {
            margin: 20px 10px;
          }
          .header, .content {
            padding: 20px;
          }
          .header h1 {
            font-size: 20px;
          }
          .reset-button {
            padding: 12px 24px;
            font-size: 15px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        
        <div class="content">
          <p class="message">
            Hello! We received a request to reset the password for your account. 
            Click the button below to create a new password.
          </p>
          
          <div class="button-container">
            <a href="${resetLink}" class="reset-button">Reset Password</a>
          </div>
          
          <div class="expiry-notice">
            <p>This link will expire in 15 minutes</p>
          </div>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Image App. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Image App" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset Your Password - Image App",
    html: htmlTemplate,
    text: `Reset Your Password

Hello! We received a request to reset the password for your account.

Reset Link: ${resetLink}

This link will expire in 15 minutes.

© ${new Date().getFullYear()} Image App. All rights reserved.`
  });
};
