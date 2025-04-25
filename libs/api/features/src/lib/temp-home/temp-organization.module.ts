import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoreModule } from '@wyecare-monorepo/api/core';
import { OrganizationsModule } from '../organizations/organizations.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { TemporaryHomeController } from './controllers/temp-organization.controller';
import { TemporaryHomeService } from './services/temp-organization.service';

@Module({
  imports: [CoreModule, OrganizationsModule, AuthorizationModule],
  controllers: [TemporaryHomeController],
  providers: [TemporaryHomeService],
  exports: [TemporaryHomeService],
})
export class TemporaryHomeModule {}
