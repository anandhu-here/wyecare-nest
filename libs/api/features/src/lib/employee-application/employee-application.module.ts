// employee-application.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { EmployeeApplicationController } from './controllers/employee-application.controller';
import { EmployeeApplicationService } from './services/employee-application.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersModule } from '../users/users.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { CoreModule } from '@wyecare-monorepo/api/core';
import { DocumentService } from './services/document.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [
    CoreModule,
    MulterModule.register({
      dest: './uploads', // Temporary destination, usually you'd use cloud storage
    }),
    OrganizationsModule,
    UsersModule,
    AuthorizationModule,
    FirebaseModule,
  ],
  controllers: [EmployeeApplicationController],
  providers: [EmployeeApplicationService, DocumentService],
  exports: [EmployeeApplicationService, DocumentService],
})
export class EmployeeApplicationModule {}
