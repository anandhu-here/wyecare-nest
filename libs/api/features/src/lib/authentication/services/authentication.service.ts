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
import { OrganizationStaffService } from '../../organizations/services/organization-staff.service';
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
    private emailService: EmailService,
    private organizationsService: OrganizationsService,
    private organizationInvitationService: OrganizationInvitationService,
    private organizationStaffService: OrganizationStaffService
  ) {}
  async registerWithInvitationToken(
    registerDto: RegisterDto,
    token?: string
  ): Promise<Partial<UserDocument>> {
    const existingUser = await this.findUserByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email is already registered');
    }
    const user = new this.userModel({
      firstName: registerDto.firstName.trim(),
      lastName: registerDto.lastName.trim(),
      email: registerDto.email.toLowerCase().trim(),
      password: registerDto.password,
      countryCode: registerDto.countryCode,
      phone: registerDto.phone.trim(),
      address: registerDto.address,
    });
    if (!token) {
      return user;
    }
    try {
      const invitation =
        await this.organizationInvitationService.getInvitationByToken(token);
      if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
        this.logger.warn(
          `Email mismatch for invitation: ${invitation.email} vs ${user.email}`
        );
        throw new BadRequestException(
          'The invitation was sent to a different email address'
        );
      }
      console.log(invitation, 'invitation');
      await this.organizationInvitationService.grantPermissionToCreateOrganization(
        user._id as any,
        invitation.roleToAssign,
        invitation.invitedBy as any
      );
      await this.organizationInvitationService.acceptInvitation(
        token,
        user._id as any
      );
      this.logger.log(
        `User ${user.email} registered with invitation token and granted create_organization permission`
      );
      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationTokenExpires = undefined;
      user.role = invitation.roleToAssign;
      await user.save();
      return user;
    } catch (error: any) {
      this.logger.error(
        `Error processing invitation during registration: ${error.message}`,
        error.stack
      );
      throw new BadRequestException(
        'Error processing invitation during registration'
      );
    }
  }
  async registerWithStaffInvitationToken(
    registerDto: RegisterDto,
    token: string
  ): Promise<Partial<UserDocument>> {
    try {
      if (!this.isValidEmail(registerDto.email)) {
        throw { code: 'VALIDATION_ERROR', message: 'Invalid email format' };
      }
      if (registerDto.password.length < 8 || registerDto.password.length > 32) {
        throw {
          code: 'VALIDATION_ERROR',
          message: 'Password must be between 8 and 32 characters',
        };
      }
      const email = registerDto.email.toLowerCase().trim();
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        throw {
          code: 'EMAIL_ALREADY_REGISTERED',
          message: 'Email is already registered',
        };
      }
      const invitation =
        await this.organizationStaffService.getStaffInvitationByToken(token);
      console.log(invitation, 'staff invitation');
      console.log(invitation.email, email, 'staff invitation email');
      if (invitation.email.toLowerCase() !== email) {
        this.logger.warn(
          `Email mismatch for staff invitation: ${invitation.email} vs ${email}`
        );
        throw new BadRequestException(
          'The invitation was sent to a different email address'
        );
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
        emailVerified: true,
        gender: registerDto.gender,
        countryMetadata: registerDto.countryMetadata,
      });
      await user.save();
      await this.organizationStaffService.processStaffInvitation(
        token,
        user._id as any
      );
      this.logger.log(
        `User ${user.email} registered with staff invitation and added to organization ${invitation.organizationId}`
      );
      return user;
    } catch (error: any) {
      this.logger.error(
        `Error during staff invitation registration: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
  async register(registerDto: RegisterDto) {
    try {
      if (!this.isValidEmail(registerDto.email)) {
        throw { code: 'VALIDATION_ERROR', message: 'Invalid email format' };
      }
      if (registerDto.password.length < 8 || registerDto.password.length > 32) {
        throw {
          code: 'VALIDATION_ERROR',
          message: 'Password must be between 8 and 32 characters',
        };
      }
      const email = registerDto.email.toLowerCase().trim();
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
      const emailToken = this.generateRandomToken();
      user.emailVerificationToken = emailToken;
      user.emailVerificationTokenExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      );
      await user.save();
      const token = await this.generateToken(user._id as any);
      const roles: any = {
        highest: null,
        lowest: null,
        primaryRole: null,
      };
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
        pendingJoinRequest: null,
        currentOrganization: roles?.highest?.organization || null,
      };
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  }
  async redirectUrlForLogin(
    userId: string,
    currentOrganizationId: string | undefined,
    permissions: string[] | undefined
  ): Promise<string> {
    const user = await this.userModel.findById(userId).exec();
    if (!user?.emailVerified) {
      return `${process.env['FRONTEND_URL']}/auth/verify-email?email=${user?.email}`;
    }
    if (!currentOrganizationId) {
      if (
        permissions?.length === 1 &&
        permissions?.includes('create_organization')
      ) {
        return `${process.env['FRONTEND_URL']}/auth/create-organization`;
      }
      return `${process.env['FRONTEND_URL']}/auth/join-organization`;
    }
    return `${process.env['FRONTEND_URL']}/dashboard`;
  }
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
    const roles =
      await this.organizationsService.getUserHighestAndLowestRolesByEmail(
        loginDto.email
      );
    const token = await this.generateToken(user._id as any);
    if (roles && roles.primaryRole && roles.primaryRole.organization) {
      console.log(roles);
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
    );
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
  async requestPasswordReset(email: string) {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw { code: 'USER_NOT_FOUND', message: 'User not found' };
    }
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetCode = resetCode;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    const emailTemplate = ``;
    await this.emailService.sendEmail({
      to: user.email,
      subject: 'Password Reset Code',
      html: emailTemplate,
    });
    return true;
  }
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
  async requestAccountDeletion(userId: string, reason: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw { code: 'USER_NOT_FOUND', message: 'User not found' };
    }
    user.accountDeletionRequested = true;
    user.accountDeletionRequestedAt = new Date();
    await user.save();
    return {
      success: true,
      message: 'Account deletion request submitted successfully',
    };
  }
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
  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }
  async findUserById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }
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
  async verifyPassword(
    providedPassword: string,
    storedPassword: string
  ): Promise<boolean> {
    console.log('providedPassword', providedPassword);
    console.log('storedPassword', storedPassword);
    console.log(await bcrypt.compare(providedPassword, storedPassword));
    return bcrypt.compare(providedPassword, storedPassword);
  }
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  private generateRandomToken(): string {
    return randomBytes(32).toString('hex');
  }
}
