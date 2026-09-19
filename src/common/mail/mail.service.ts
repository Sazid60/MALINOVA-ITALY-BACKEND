import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT', '587'));
    const secure = this.config.get<string>('SMTP_SECURE') === 'true' || port === 465;
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      this.logger.log(`Nodemailer SMTP initialized successfully with host: ${host}:${port}`);
    } else {
      this.logger.warn(
        'SMTP credentials not fully configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Email sending will operate in DEV simulation mode.',
      );
    }
  }

  async sendPasswordResetOtp(to: string, otp: string, userName = 'Admin'): Promise<boolean> {
    const from =
      this.config.get<string>('SMTP_FROM') ||
      '"Milanova Technologies" <no-reply@milanova-tech.com>';

    const subject = 'Your Password Reset OTP - Milanova Technologies';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,102,138,0.06); }
    .header { background: #00668a; padding: 28px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { color: #e6eff6; margin: 4px 0 0 0; font-size: 13px; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
    .lead { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .otp-box { background: #f0f7fb; border: 1.5px dashed #00668a; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-label { font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.08em; color: #00668a; margin-bottom: 6px; }
    .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 0.18em; color: #003b52; font-family: monospace; }
    .expiry { font-size: 12px; color: #64748b; margin-top: 6px; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Milanova Technologies</h1>
      <p>Digital Technology Agency • Security Verification</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${userName},</div>
      <div class="lead">
        We received a request to reset the password for your account. Use the one-time verification code below to complete the reset process:
      </div>

      <div class="otp-box">
        <div class="otp-label">One-Time Verification Code</div>
        <div class="otp-code">${otp}</div>
        <div class="expiry">This code will expire in 5 minutes.</div>
      </div>

      <div class="lead" style="font-size: 13px; color: #64748b;">
        If you did not initiate this request, you can safely ignore this email. Your password will remain unchanged.
      </div>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Milanova Technologies. Italy Registered Digital Technology Agency.
    </div>
  </div>
</body>
</html>
    `;

    const text = `Hello ${userName},\n\nYour Milanova Technologies password reset code is: ${otp}\nThis code is valid for 5 minutes.\n\nIf you did not request this, please ignore this email.`;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to,
          subject,
          text,
          html,
        });
        this.logger.log(`Password reset OTP email sent successfully to: ${to}`);
        return true;
      } catch (err: any) {
        this.logger.error(`Failed to send email to ${to} via SMTP: ${err.message}`, err.stack);
        this.logger.warn(`[DEV FALLBACK] OTP for ${to} is: ${otp}`);
        return false;
      }
    } else {
      this.logger.warn(
        `\n=======================================================\n` +
          `[EMAIL NOT SENT - NO SMTP CONFIGURED]\n` +
          `To: ${to}\n` +
          `Subject: ${subject}\n` +
          `OTP Code: ${otp}\n` +
          `=======================================================`,
      );
      return true;
    }
  }
}
