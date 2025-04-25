import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvoiceController } from './controllers/invoice.controller';
import { InvoiceService } from './services/invoice.service';
import { EventsModule } from '../events/events.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { CoreModule } from '@wyecare-monorepo/api/core';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [CoreModule, EventsModule, AuthorizationModule, OrganizationsModule],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceModule {}
