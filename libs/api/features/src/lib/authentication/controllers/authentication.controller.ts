import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '../services/authentication.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import {
  RequestResetDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from '../dto/other-auth.dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RequirePermission } from '../../authorization/permissions.decorator';
import { OrganizationsService } from '../../organizations/services/organizations.service';
import { AuthorizationService } from '../../authorization/services/authorization.service';
import { OrganizationContextGuard } from '../../organizations/organization-context.guard';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly organizationsService: OrganizationsService,
    private authorizationService: AuthorizationService
  ) {}
  @Get('test-auth')
  @UseGuards(JwtAuthGuard)
  testAuth(@Req() req: any) {
    console.log('Test auth endpoint reached');
    console.log('User from request:', req.user);
    return {
      success: true,
      message: 'Auth test',
      user: req.user ? true : false,
    };
  }
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Res() res: Response) {
    try {
      const result = await this.authService.register(registerDto);
      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Registration successful',
        data: result,
      });
    } catch (error: any) {
      if (error.code === 'EMAIL_ALREADY_REGISTERED') {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: error.message,
          isEmailUsed: true,
        });
      }
      if (error.code === 'VALIDATION_ERROR') {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Something went wrong',
      });
    }
  }
  @Post('register-with-invitation')
  async registerWithInvitation(
    @Body() registerDto: RegisterDto,
    @Query('token') token: string,
    @Res() res: Response
  ) {
    try {
      if (!token) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Invitation token is required',
        });
      }
      const user: any = await this.authService.registerWithInvitationToken(
        registerDto,
        token
      );
      const authToken = await this.authService.generateToken(
        user._id.toString()
      );
      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Registration successful with invitation',
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          canCreateOrganization: true,
        },
        token: authToken,
      });
    } catch (error: any) {
      if (error.code === 'EMAIL_ALREADY_REGISTERED') {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: error.message,
          isEmailUsed: true,
        });
      }
      if (error.code === 'VALIDATION_ERROR') {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message && error.message.includes('invitation')) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Something went wrong during registration',
      });
    }
  }
  @Post('register-with-staff-invitation')
  async registerWithStaffInvitation(
    @Body() registerDto: RegisterDto,
    @Query('token') token: string,
    @Query('type') type: string,
    @Res() res: Response
  ) {
    try {
      if (!token) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Invitation token is required',
        });
      }
      if (type !== 'staff') {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Invalid invitation type',
        });
      }
      const user = await this.authService.registerWithStaffInvitationToken(
        registerDto,
        token
      );
      const authToken = await this.authService.generateToken(user._id as any);
      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Registration successful with staff invitation',
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        token: authToken,
      });
    } catch (error: any) {
      if (error.code === 'EMAIL_ALREADY_REGISTERED') {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: error.message,
          isEmailUsed: true,
        });
      }
      if (error.code === 'VALIDATION_ERROR') {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message && error.message.includes('invitation')) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message:
          'Something went wrong during registration with staff invitation',
        error: error.message,
      });
    }
  }
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    try {
      console.log('Login DTO:', loginDto);
      const result = await this.authService.login(loginDto);
      return res.status(HttpStatus.OK).json({
        message: 'Login successful',
        user: result.user,
        token: result.token,
      });
    } catch (error: any) {
      if (error.code === 'INVALID_CREDENTIALS') {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Invalid credentials',
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred during login',
      });
    }
  }
  @Post('verify-email')
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
    @Res() res: Response
  ) {
    try {
      const result = await this.authService.verifyEmail(verifyEmailDto.token);
      return res.status(HttpStatus.OK).json({
        user: result,
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error: any) {
      if (error.code === 'INVALID_TOKEN') {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Invalid verification token',
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Something went wrong',
      });
    }
  }
  @Post('resend-verification-email')
  async resendVerificationEmail(
    @Body() body: { email: string },
    @Res() res: Response
  ) {
    try {
      await this.authService.resendVerificationEmail(body.email);
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Verification email resent successfully',
      });
    } catch (error: any) {
      if (error.code === 'USER_NOT_FOUND') {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'User not found',
        });
      }
      if (error.code === 'EMAIL_ALREADY_VERIFIED') {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Email is already verified',
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to resend verification email',
      });
    }
  }
  @Post('request-reset')
  async requestReset(
    @Body() requestResetDto: RequestResetDto,
    @Res() res: Response
  ) {
    try {
      await this.authService.requestPasswordReset(requestResetDto.email);
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Password reset code sent successfully',
      });
    } catch (error: any) {
      if (error.code === 'USER_NOT_FOUND') {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'User not found',
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to send password reset email',
      });
    }
  }
  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Res() res: Response
  ) {
    try {
      await this.authService.resetPassword(
        resetPasswordDto.email,
        resetPasswordDto.code,
        resetPasswordDto.newPassword
      );
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error: any) {
      if (error.code === 'INVALID_RESET_CODE') {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Invalid reset code',
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Password reset failed',
      });
    }
  }
  @UseGuards(JwtAuthGuard)
  @Post('request-account-deletion')
  @RequirePermission('delete_account')
  async requestAccountDeletion(
    @Req() req: any,
    @Body() body: { reason: string },
    @Res() res: Response
  ) {
    try {
      const result = await this.authService.requestAccountDeletion(
        req.user._id.toString(),
        body.reason
      );
      return res.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Something went wrong',
      });
    }
  }
  @UseGuards(JwtAuthGuard)
  @Post('cancel-account-deletion')
  @RequirePermission('delete_account')
  async cancelAccountDeletion(@Req() req: any, @Res() res: Response) {
    try {
      const result = await this.authService.cancelAccountDeletion(
        req.user._id.toString()
      );
      return res.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Something went wrong',
      });
    }
  }
  @Get('profile')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard, JwtAuthGuard)
  async getProfile(@Req() req: any, @Res() res: Response) {
    try {
      const redirectUr = await this.authService.redirectUrlForLogin(
        req.user?._id?.toString(),
        req.currentOrganization?._id?.toString() || undefined,
        req.permissions || []
      );

      console.log(req.permissions?.length);
      return res.status(HttpStatus.OK).json({
        user: req.user,
        organization: req.organization,
        organizationRoles: req.organizationRoles,
        pendingJoinRequest: req.pendingJoinRequest,
        currentOrganization: req.currentOrganization,
        permissions: req.permissions,
        staffType: req.staffType,
        unReadNotificationCount: req.unReadNotificationCount,
        totalOrgRoles: req.totalOrgRoles,
        redirectUrl: redirectUr,
      });
    } catch (error: any) {
      console.log(error, 'Error in getProfile method');
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'An error occurred while fetching profile',
      });
    }
  }
}
