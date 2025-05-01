// libs/api/features/src/lib/shifts/shift-types.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShiftTypesController } from './controllers/shift-types.controller';
import { ShiftTypesService } from './services/shift-types.service';
import { CoreModule } from '@wyecare-monorepo/api/core';
import { OrganizationsModule } from '../organizations/organizations.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [CoreModule, OrganizationsModule, AuthorizationModule],
  controllers: [ShiftTypesController],
  providers: [ShiftTypesService],
  exports: [ShiftTypesService],
})
export class ShiftTypesModule {}
