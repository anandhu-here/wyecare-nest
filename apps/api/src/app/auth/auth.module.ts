// apps/api/src/app/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { InvitationsController } from './controllers/invitations.controller';
import { InvitationsService } from './services/invitations.service';
import { UsersService } from '../users/services/users.service';
import { EmailService } from '../shared/services/email.service';
import { AbilityFactory } from '../casl/abilities/ability.factory';
import { OrganizationsService } from '../organizations/services/organizations.service';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController, InvitationsController],
  providers: [
    AuthService,
    InvitationsService,
    UsersService,
    AbilityFactory,
    EmailService,
    JwtStrategy,
    LocalStrategy,
    OrganizationsService,
  ],
  exports: [AuthService, InvitationsService],
})
export class AuthModule {}
