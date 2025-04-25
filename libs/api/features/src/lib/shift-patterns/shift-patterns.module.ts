import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShiftPatternsController } from './controllers/shift-patterns.controller';
import { ShiftPatternsService } from './services/shift-patterns.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { CoreModule } from '@wyecare-monorepo/core';

@Module({
  imports: [CoreModule, OrganizationsModule, AuthorizationModule],
  controllers: [ShiftPatternsController],
  providers: [ShiftPatternsService],
  exports: [ShiftPatternsService],
})
export class ShiftPatternsModule {}
