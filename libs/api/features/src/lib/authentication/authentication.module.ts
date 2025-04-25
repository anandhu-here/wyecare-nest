import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CoreModule } from '@wyecare-monorepo/api/core';
import { UtilsModule } from '@wyecare-monorepo/shared-utils';

import { AuthController } from './controllers/authentication.controller';
import { AuthService } from './services/authentication.service';
import { JwtStrategy } from './jwt/jwt.strategy';
import { OrganizationInvitationService } from '../super-admin/services/organization-invitation.service';
import { EmailService } from 'libs/shared/utils/src/lib/services/email.service';
import { AuthorizationService } from '../authorization/services/authorization.service';
import { PermissionsService } from '../authorization/services/permissions.service';
import { RolesService } from '../authorization/services/roles.service';
import { TestController } from './controllers/test-controller';
import { AuthorizationModule } from '../authorization/authorization.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { OrganizationStaffService } from '../organizations/services/organization-staff.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    CoreModule, // Import CoreModule instead of using MongooseModule.forFeature
    AuthorizationModule,
    OrganizationsModule,
    UtilsModule,
  ],
  controllers: [AuthController, TestController],
  providers: [
    AuthService,
    JwtStrategy,
    OrganizationInvitationService,
    EmailService,
    AuthorizationService,
    PermissionsService,
    RolesService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
