// app/auth/controllers/auth.controller.ts

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { CreateOrganizationDto } from '../../organizations/dto/create-organization.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto, @Request() req) {
    const response = await this.authService.login(req.user);
    console.log('Login response:', response);
    return response;
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid invitation',
  })
  async register(
    @Body() createUserDto: CreateUserDto,
    @Query('invitationToken') invitationToken?: string
  ) {
    return this.authService.register(createUserDto, invitationToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns the user profile',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Request() req) {
    return req.user;
  }

  @Post('create-super-admin')
  @ApiOperation({
    summary: 'Create the initial super admin (one-time operation)',
  })
  @ApiResponse({
    status: 201,
    description: 'Super admin created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid secret key',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Super admin already exists',
  })
  async createSuperAdmin(
    @Body() createUserDto: CreateUserDto,
    @Query('secretKey') secretKey: string
  ) {
    return this.authService.createInitialSuperAdmin(createUserDto, secretKey);
  }

  @Post('register-with-organization')
  @ApiOperation({ summary: 'Register a new user with organization' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid invitation',
  })
  async registerWithOrganization(
    @Body()
    registerData: { user: CreateUserDto; organization: CreateOrganizationDto },
    @Query('invitationToken') invitationToken: string
  ) {
    return this.authService.register(
      registerData.user,
      invitationToken,
      registerData.organization
    );
  }
}
