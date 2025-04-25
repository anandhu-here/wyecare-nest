// libs/api/features/src/lib/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Put,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from 'libs/api/core/src/lib/schemas';
import { UpdateUserDto } from '../dto/update-user.dto';
import { JwtAuthGuard } from '../../authentication/jwt/jwt-auth.guard';
// Import additional DTOs as needed
// import { UpdateTimezoneDto } from './dto/update-timezone.dto';
// import { LinkUserDto } from './dto/link-user.dto';
// import { UnlinkUserDto } from './dto/unlink-user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The user has been successfully created',
    type: User,
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all users',
    type: [User],
  })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user profile by identifier (email or ID)' })
  @ApiQuery({
    name: 'identifier',
    required: true,
    description: 'User email or ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the user profile',
    type: User,
  })
  async getUserProfile(@Query('identifier') identifier: string): Promise<User> {
    // Check if identifier is an email
    if (identifier.includes('@')) {
      return this.usersService.findByEmail(identifier);
    }
    // Otherwise treat as ID
    return this.usersService.findOne(identifier);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user profile has been successfully updated',
    type: User,
  })
  async updateUserProfile(
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: any
  ): Promise<User> {
    // Assuming you have the user ID in the request (from auth)
    // If not, you might need to modify this to accept user ID in the request body
    console.log('Updating user profile');
    const userId = req.user?._id; // Replace with how you actually get the user ID
    return this.usersService.update(userId, updateUserDto);
  }

  @Put('update-timezone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user timezone' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user timezone has been successfully updated',
    type: User,
  })
  async updateTimeZone(
    @Body() body: { timezone: string },
    @Req() req: any
  ): Promise<User> {
    const userId = req.user?.id; // Replace with how you actually get the user ID
    return this.usersService.update(userId, { timezone: body.timezone });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the user with the given ID',
    type: User,
  })
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Get(':accountType')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get users by account type' })
  @ApiParam({ name: 'accountType', description: 'User account type' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns users with the given account type',
    type: [User],
  })
  async getUsersByAccountType(
    @Param('accountType') accountType: string
  ): Promise<User[]> {
    // This would need to be implemented in your service
    // return this.usersService.findByAccountType(accountType);
    return this.usersService.findAll(); // Placeholder until you implement findByAccountType
  }

  @Get('search-users/:accountType')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search users by company name and account type' })
  @ApiParam({ name: 'accountType', description: 'User account type' })
  @ApiQuery({ name: 'companyName', description: 'Company name to search for' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns users matching the search criteria',
    type: [User],
  })
  async searchUsers(
    @Param('accountType') accountType: string,
    @Query('companyName') companyName: string
  ): Promise<User[]> {
    // This would need to be implemented in your service
    // return this.usersService.searchByCompanyName(companyName, accountType);
    return this.usersService.findAll(); // Placeholder until you implement search
  }

  @Get('current')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user organization details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns current user organization details',
    type: User,
  })
  async getCurrentOrganizationDetails(@Req() req: any): Promise<User> {
    const userId = req.user?.id; // Replace with how you actually get the user ID
    return this.usersService.findOne(userId);
  }

  @Get('primary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get primary user organization details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns primary user organization details',
    type: User,
  })
  async getPrimaryOrganizationDetails(@Req() req: any): Promise<User> {
    const userId = req.user?.id; // Replace with how you actually get the user ID
    return this.usersService.findOne(userId);
  }

  @Get('all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all user organizations details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all user organizations details',
    type: [User],
  })
  async getAllUserOrganizationsDetails(@Req() req: any): Promise<User[]> {
    // This would need to be implemented in your service
    // return this.usersService.findAllUserOrganizations(req.user?.id);
    return this.usersService.findAll(); // Placeholder
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user has been successfully updated',
    type: User,
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user has been successfully deleted',
    type: User,
  })
  async remove(@Param('id') id: string): Promise<User> {
    return this.usersService.remove(id);
  }
}
