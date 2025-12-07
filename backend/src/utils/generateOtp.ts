import nodemailer from "nodemailer";

export const generateOTP = (): string => Math.floor(100000 + Math.random() * 900000).toString();

export const sendOTPEmail = async (to: string, otp: string): Promise<void> => {
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
      <title>Your Verification Code</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: rgb(8, 131, 232);
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
          background-color:rgb(8, 131, 232);
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
          text-align: center;
        }
        .message {
          font-size: 16px;
          color: #333333;
          margin-bottom: 30px;
          line-height: 1.6;
        }
        .otp-code {
          background-color: #f8f9fa;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
          text-align: center;
        }
        .otp-code h2 {
          font-size: 32px;
          font-weight: 700;
          color: #000000;
          letter-spacing: 4px;
          margin: 0;
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
          .otp-code h2 {
            font-size: 28px;
            letter-spacing: 2px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verification Code</h1>
        </div>
        
        <div class="content">
          <p class="message">
            Your verification code for Image App registration:
          </p>
          
          <div class="otp-code">
            <h2>${otp}</h2>
          </div>
          
          <div class="expiry-notice">
            <p>This code will expire in 1 minute</p>
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
    subject: "Your Verification Code - Image App",
    html: htmlTemplate,
    text: `Your verification code is ${otp}. It expires in 1 minute.

    © ${new Date().getFullYear()} Image App. All rights reserved.`
  });
};
