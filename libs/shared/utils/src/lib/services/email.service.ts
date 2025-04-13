import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private transporter: any;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPass = this.configService.get<string>('EMAIL_PASS');

    if (!emailUser || !emailPass) {
      this.logger.warn('Email credentials not properly configured');
    }

    // Create SMTP transporter
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // Assuming Gmail is used
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: emailUser || 'noreply@wyecaresolutions.com',
        pass: emailPass || '',
      },
      tls: {
        rejectUnauthorized: false, // For development, can be removed in production
      },
    });
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const { to, subject, html, from } = options;

      const mailOptions = {
        from:
          from ||
          this.configService.get<string>('EMAIL_USER') ||
          'noreply@wyecaresolutions.com',
        to,
        subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent: ${info.messageId}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Verify transporter connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email service connection verified');
      return true;
    } catch (error: any) {
      this.logger.error(
        `Email service connection failed: ${error.message}`,
        error.stack
      );
      return false;
    }
  }
}
