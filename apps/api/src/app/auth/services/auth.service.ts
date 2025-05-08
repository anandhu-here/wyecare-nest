// app/auth/services/auth.service.ts

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../../users/services/users.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import { CreateOrganizationDto } from '../../organizations/dto/create-organization.dto';
import { OrganizationsService } from '../../organizations/services/organizations.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private organizationsService: OrganizationsService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Don't return the password
    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    try {
      // Get user roles
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId: user.id },
        include: { role: true },
      });

      const roles = userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        isSystemRole: ur.role.isSystemRole,
      }));

      const payload = {
        sub: user.id,
        email: user.email,
        organizationId: user.organizationId,
        roles,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          organizationId: user.organizationId,
          roles,
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new BadRequestException(`Login failed: ${error.message}`);
    }
  }

  async register(
    createUserDto: CreateUserDto,
    invitationToken?: string,
    organizationData?: CreateOrganizationDto
  ) {
    let invitation;

    // If invitation token is provided, validate it
    if (invitationToken) {
      invitation = await this.validateInvitation(
        invitationToken,
        createUserDto.email
      );
    } else {
      // Check if system allows open registration
      const systemSettings = await this.prisma.systemSettings.findFirst();
      if (systemSettings?.requireInvitation) {
        throw new UnauthorizedException(
          'Registration requires an invitation token'
        );
      }
    }

    try {
      // Transaction to handle user creation, role assignment, and organization creation
      return await this.prisma.$transaction(async (prisma) => {
        // Create the user
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const user = await prisma.user.create({
          data: {
            email: createUserDto.email,
            password: hashedPassword,
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
            isActive: true,
            organizationId: invitation?.organizationId || null,
          },
        });

        // If there was an invitation with a role, assign that role
        if (invitation && invitation.roleId) {
          await prisma.userRole.create({
            data: {
              userId: user.id,
              roleId: invitation.roleId,
            },
          });
        } else {
          // Assign basic Staff role if no specific role was invited
          const staffRole = await prisma.role.findFirst({
            where: { name: 'Staff', isSystemRole: true },
          });

          if (staffRole) {
            await prisma.userRole.create({
              data: {
                userId: user.id,
                roleId: staffRole.id,
              },
            });
          }
        }

        // If organization data is provided and user was invited as org admin, create organization
        if (organizationData && invitation) {
          const invitedRole = await prisma.role.findUnique({
            where: { id: invitation.roleId },
          });

          // Only allow organization creation for org admin role
          if (invitedRole && invitedRole.name === 'Organization Admin') {
            const organization = await prisma.organization.create({
              data: {
                ...organizationData,
                users: {
                  connect: { id: user.id },
                },
              } as any,
            });

            // Update user with organization
            await prisma.user.update({
              where: { id: user.id },
              data: { organizationId: organization.id },
            });
          }
        }

        // If there was an invitation, update its status
        if (invitation) {
          await prisma.invitation.update({
            where: { token: invitationToken },
            data: {
              status: 'ACCEPTED',
              acceptedAt: new Date(),
              acceptedById: user.id,
            },
          });
        }

        return this.login(user);
      });
    } catch (error) {
      throw new BadRequestException(`Registration failed: ${error.message}`);
    }
  }

  private async validateInvitation(token: string, email: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new UnauthorizedException('Invalid invitation token');
    }

    if (invitation.status !== 'PENDING') {
      throw new UnauthorizedException('Invitation has already been used');
    }

    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      throw new UnauthorizedException('Invitation has expired');
    }

    if (invitation.email && invitation.email !== email) {
      throw new UnauthorizedException(
        'Invitation was issued for a different email address'
      );
    }

    return invitation;
  }
  async createInitialSuperAdmin(
    createUserDto: CreateUserDto,
    secretKey: string
  ): Promise<any> {
    // Verify secret key
    const configuredSecretKey =
      this.configService.get<string>('SUPER_ADMIN_SECRET');
    if (!configuredSecretKey || secretKey !== configuredSecretKey) {
      throw new UnauthorizedException('Invalid secret key');
    }

    // Check if any super admin already exists
    const existingSuperAdmins = await this.prisma.userRole.findFirst({
      where: {
        role: {
          name: 'Super Admin',
          isSystemRole: true,
        },
      },
    });

    try {
      // Create the user
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const user = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          password: hashedPassword,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          isActive: true,
        },
      });

      // Find Super Admin role
      const superAdminRole = await this.prisma.role.findFirst({
        where: {
          name: 'Super Admin',
          isSystemRole: true,
        },
      });

      if (!superAdminRole) {
        throw new NotFoundException('Super Admin role not found in the system');
      }

      // Assign Super Admin role
      await this.prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: superAdminRole.id,
        },
      });

      // Return JWT token
      return this.login(user);
    } catch (error) {
      throw new BadRequestException(
        `Failed to create super admin: ${error.message}`
      );
    }
  }

  async getCurrentOrganization(orgId: string) {
    const organization = await this.organizationsService.findOne(orgId);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }
}
