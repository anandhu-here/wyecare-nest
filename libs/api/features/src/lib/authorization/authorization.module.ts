import { Module } from '@nestjs/common';
import { CoreModule } from '@wyecare-monorepo/api/core';
import { PermissionsService } from './services/permissions.service';
import { RolesService } from './services/roles.service';
import { AuthorizationService } from './services/authorization.service';
import { SeedController } from './controllers/seed-permissions.controller';
import { SeedService } from './services/seed.service';

console.log('AuthModule is being loaded');

@Module({
  imports: [
    CoreModule, // Import CoreModule instead of using MongooseModule.forFeature
  ],
  providers: [
    PermissionsService,
    RolesService,
    AuthorizationService,
    SeedService,
  ],
  controllers: [SeedController],
  exports: [
    PermissionsService,
    RolesService,
    AuthorizationService,
    SeedService,
  ],
})
export class AuthorizationModule {}
