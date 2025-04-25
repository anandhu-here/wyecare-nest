import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoreModule } from '@wyecare-monorepo/api/core';
import { EmployeeAvailabilityController } from './controllers/employee-availability.controller';
import { EmployeeAvailabilityService } from './services/employee-availability.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [CoreModule, OrganizationsModule, AuthorizationModule],
  controllers: [EmployeeAvailabilityController],
  providers: [EmployeeAvailabilityService],
  exports: [EmployeeAvailabilityService],
})
export class EmployeeAvailabilityModule {}
