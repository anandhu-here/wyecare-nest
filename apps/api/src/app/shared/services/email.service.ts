// app/shared/services/email.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    // Create reusable transporter
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPass = this.configService.get<string>('EMAIL_PASS');
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

  async sendInvitationEmail(
    email: string,
    token: string,
    invitedBy: { name: string; email: string },
    organizationName?: string,
    roleName?: string,
    message?: string
  ): Promise<boolean> {
    const appUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const registerUrl = `${appUrl}/accept-invitation/${token}`;

    try {
      const info = await this.transporter.sendMail({
        from: `"${this.configService.get<string>(
          'EMAIL_FROM_NAME'
        )}" <${this.configService.get<string>('EMAIL_FROM_ADDRESS')}>`,
        to: email,
        subject: `Invitation to join ${organizationName || 'our platform'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>You've been invited to join ${
              organizationName || 'our platform'
            }</h2>
            <p>${invitedBy.name} (${invitedBy.email}) has invited you to join ${
          organizationName || 'our platform'
        }${roleName ? ` as a ${roleName}` : ''}.</p>
            ${
              message
                ? `<p>Message from ${invitedBy.name}: "${message}"</p>`
                : ''
            }
            <p>To accept this invitation, please click the button below:</p>
            <p>
              <a href="${registerUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Accept Invitation
              </a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p>${registerUrl}</p>
            <p>This invitation will expire in 30 days.</p>
            <p>If you did not expect this invitation, you can safely ignore this email.</p>
          </div>
        `,
      });

      this.logger.log(`Invitation email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send invitation email to ${email}: ${error.message}`
      );
      return false;
    }
  }
}
