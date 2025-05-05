// app/auth/strategies/jwt.strategy.ts

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  organizationId?: string;
  roles: any[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    // Get latest user data
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        organizationId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    // Get user roles and permissions
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: user.id },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const roles = userRoles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      isSystemRole: ur.role.isSystemRole,
    }));

    const permissions = userRoles.flatMap((ur) =>
      ur.role.permissions.map((rp) => ({
        action: rp.permission.action,
        subject: rp.permission.subject,
        conditions: rp.conditions,
      }))
    );

    return {
      ...user,
      roles,
      permissions,
    };
  }
}
