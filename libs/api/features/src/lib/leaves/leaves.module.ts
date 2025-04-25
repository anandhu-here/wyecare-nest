import { Module } from '@nestjs/common';
import { CoreModule } from '@wyecare-monorepo/api/core';
import { AuthorizationModule } from '../authorization/authorization.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { LeaveManagementController } from './controllers/leaves.controller';
import { LeaveManagementService } from './services/leaves.service';

@Module({
  imports: [CoreModule, AuthorizationModule, OrganizationsModule],
  controllers: [LeaveManagementController],
  providers: [LeaveManagementService],
  exports: [LeaveManagementService],
})
export class LeavesModule {}
