import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User, UserDocument } from '../../users/schemas/user.schema';

import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { getEmailVerificationTemplate } from '../utils/verify-email.template';
import { randomBytes } from 'crypto';
import { EmailService } from 'libs/shared/utils/src/lib/services/email.service';
import { OrganizationsService } from '../../organizations/services/organizations.service';
import { OrganizationInvitationService } from '../../super-admin/services/organization-invitation.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
    private emailService: EmailService,
    private organizationsService: OrganizationsService,
    private organizationInvitationService: OrganizationInvitationService
  ) {}

  async registerWithInvitationToken(
    registerDto: RegisterDto,
    token?: string
  ): Promise<Partial<UserDocument>> {
    // Create the user account first
    const user = await this.register(registerDto);

    // If no token is provided, just return the normal user
    if (!token) {
      return user.user;
    }

    try {
      // Validate and process the invitation token
      const invitation =
        await this.organizationInvitationService.getInvitationByToken(token);

      // Check if invitation email matches registration email
      if (invitation.email.toLowerCase() !== user.user.email.toLowerCase()) {
        this.logger.warn(
          `Email mismatch for invitation: ${invitation.email} vs ${user.user.email}`
        );
        throw new BadRequestException(
          'The invitation was sent to a different email address'
        );
      }

      // Grant permission to create organization with the specified role
      await this.organizationInvitationService.grantPermissionToCreateOrganization(
        user.user._id as any,
        invitation.roleToAssign,
        invitation.invitedBy as any
      );

      // Mark the invitation as accepted
      await this.organizationInvitationService.acceptInvitation(
        token,
        user.user._id as any
      );

      this.logger.log(
        `User ${user.user.email} registered with invitation token and granted create_organization permission`
      );

      return user.user;
    } catch (error: any) {
      // Log the error but don't prevent user registration
      this.logger.error(
        `Error processing invitation during registration: ${error.message}`,
        error.stack
      );
      return user.user;
    }
  }

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto) {
    try {
      // Validate email format
      if (!this.isValidEmail(registerDto.email)) {
        throw { code: 'VALIDATION_ERROR', message: 'Invalid email format' };
      }

      // Validate password
      if (registerDto.password.length < 8 || registerDto.password.length > 32) {
        throw {
          code: 'VALIDATION_ERROR',
          message: 'Password must be between 8 and 32 characters',
        };
      }

      const email = registerDto.email.toLowerCase().trim();

      // Check if user already exists
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        throw {
          code: 'EMAIL_ALREADY_REGISTERED',
          message: 'Email is already registered',
        };
      }

      const user = new this.userModel({
        firstName: registerDto.firstName.trim(),
        lastName: registerDto.lastName.trim(),
        email,
        role: registerDto.role,
        password: registerDto.password,
        countryCode: registerDto.countryCode,
        phone: registerDto.phone.trim(),
        address: registerDto.address,
        emailVerified: false,
        gender: registerDto.gender,
        countryMetadata: registerDto.countryMetadata,
      });

      // Generate email verification token
      const emailToken = this.generateRandomToken();
      user.emailVerificationToken = emailToken;
      user.emailVerificationTokenExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ); // 24 hours

      await user.save();

      // Generate JWT token
      const token = await this.generateToken(user._id as any);

      // Get user roles
      // const roles = await this.organizationsService.getUserHighestAndLowestRoles(
      //   user._id.toString()
      // );
      const roles: any = {
        highest: null,
        lowest: null,
        primaryRole: null,
      };

      // Send verification email
      const emailTemplate = getEmailVerificationTemplate(
        emailToken,
        user.firstName
      );

      try {
        await this.emailService.sendEmail({
          to: user.email,
          subject: 'Verify Your Email',
          html: emailTemplate,
        });
        this.logger.log(`Email verification sent to user ${user.email}`);
      } catch (error) {
        this.logger.error(
          `Failed to send verification email to ${user.email}`,
          error
        );
      }

      // Create initial organization roles if needed
      // This would be implemented based on your business logic

      return {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        token,
        pendingJoinRequest: null, // Would be fetched from join request service
        currentOrganization: roles?.highest?.organization || null,
      };
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  }

  /**
   * Login a user
   */
  async login(loginDto: LoginDto) {
    const email = loginDto.email.toLowerCase();
    console.log(`Attempting to find user with email: ${email}`);

    const user = await this.findUserByEmail(email);

    if (!user) {
      throw { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' };
    }
    const isPasswordValid = await user.comparePassword(loginDto.password);
    if (!isPasswordValid) {
      throw { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' };
    }

    // Get roles for user
    const roles =
      await this.organizationsService.getUserHighestAndLowestRolesByEmail(
        loginDto.email
      );

    // const roles: any = {
    //   highest: null,
    //   lowest: null,
    //   primaryRole: null,
    // };

    const token = await this.generateToken(user._id as any);

    // Handle organization role logic
    if (roles && roles.primaryRole && roles.primaryRole.organization) {
      console.log(roles);
      // Update or create organization role for the user
      // This would be implemented based on your business logic
    }

    return {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Verify a user's email
   */
  async verifyEmail(token: string) {
    const user = await this.userModel.findOne({
      emailVerificationToken: token,
      emailVerificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      throw { code: 'INVALID_TOKEN', message: 'Invalid verification token' };
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;

    await user.save();

    return user;
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string) {
    const user = await this.findUserByEmail(email);

    if (!user) {
      throw { code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    if (user.emailVerified) {
      throw {
        code: 'EMAIL_ALREADY_VERIFIED',
        message: 'Email is already verified',
      };
    }

    const newEmailToken = this.generateRandomToken();

    user.emailVerificationToken = newEmailToken;
    user.emailVerificationTokenExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ); // 24 hours

    await user.save();

    const emailTemplate = getEmailVerificationTemplate(
      newEmailToken,
      user.firstName
    );

    await this.emailService.sendEmail({
      to: user.email,
      subject: 'Verify Your Email',
      html: emailTemplate,
    });

    return true;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string) {
    const user = await this.findUserByEmail(email);

    if (!user) {
      throw { code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    // Generate a 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.passwordResetCode = resetCode;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.save();

    // Send reset code email
    const emailTemplate = ``;
    await this.emailService.sendEmail({
      to: user.email,
      subject: 'Password Reset Code',
      html: emailTemplate,
    });

    return true;
  }

  /**
   * Reset user password
   */
  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.userModel.findOne({
      email,
      passwordResetCode: code,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw { code: 'INVALID_RESET_CODE', message: 'Invalid reset code' };
    }

    user.password = await this.hashPassword(newPassword);
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    return true;
  }

  /**
   * Request account deletion
   */
  async requestAccountDeletion(userId: string, reason: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw { code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    user.accountDeletionRequested = true;
    user.accountDeletionRequestedAt = new Date();
    // You might want to store the reason somewhere

    await user.save();

    return {
      success: true,
      message: 'Account deletion request submitted successfully',
    };
  }

  /**
   * Cancel account deletion
   */
  async cancelAccountDeletion(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw { code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    user.accountDeletionRequested = false;
    user.accountDeletionRequestedAt = undefined;

    await user.save();

    return {
      success: true,
      message: 'Account deletion request cancelled successfully',
    };
  }

  /**
   * Find a user by email
   */
  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  /**
   * Find a user by ID
   */
  async findUserById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  /**
   * Generate JWT token
   */
  async generateToken(userId: string): Promise<string> {
    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      this.logger.error('JWT_SECRET is not defined in environment variables');
      throw new Error('JWT_SECRET is not defined');
    }

    return jwt.sign({ userId }, secret, {
      expiresIn: '1d',
      algorithm: 'HS256',
    });
  }

  /**
   * Verify password
   */
  async verifyPassword(
    providedPassword: string,
    storedPassword: string
  ): Promise<boolean> {
    console.log('providedPassword', providedPassword);
    console.log('storedPassword', storedPassword);
    console.log(await bcrypt.compare(providedPassword, storedPassword));
    return bcrypt.compare(providedPassword, storedPassword);
  }

  /**
   * Hash password
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate random token
   */
  private generateRandomToken(): string {
    return randomBytes(32).toString('hex');
  }
}
