// verify-email.template.ts
export function getEmailVerificationTemplate(
  token: string,
  firstName: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #333;">Verify Your Email Address</h2>
      <p>Hello ${firstName},</p>
      <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env['FRONTEND_URL']}/verify-email?token=${token}" 
           style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Verify Email
        </a>
      </div>
      <p>If you did not create an account, please ignore this email.</p>
      <p>If the button doesn't work, you can also use this verification code: <strong>${token}</strong></p>
      <p>Best regards,<br>The WyeCare Team</p>
    </div>
  `;
}

// reset-password.template.ts
export function getPasswordResetTemplate(
  resetCode: string,
  firstName: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Hello ${firstName},</p>
      <p>We received a request to reset your password. Please use the following code to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
          ${resetCode}
        </div>
      </div>
      <p>This code will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email or contact support.</p>
      <p>Best regards,<br>The WyeCare Team</p>
    </div>
  `;
}
