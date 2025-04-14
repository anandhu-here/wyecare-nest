// Update shifts.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShiftsController } from './controllers/shifts.controller';
import { ShiftsService } from './services/shifts.service';
import { Shift, ShiftSchema } from './schemas/shift.schema';
import {
  ShiftAssignment,
  ShiftAssignmentSchema,
} from './schemas/shift-assignment.schema';
import { OrganizationsModule } from '../organizations/organizations.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Shift.name, schema: ShiftSchema },
      { name: ShiftAssignment.name, schema: ShiftAssignmentSchema },
    ]),
    OrganizationsModule,
    AuthorizationModule,
  ],
  controllers: [ShiftsController],
  providers: [ShiftsService],
  exports: [ShiftsService],
})
export class ShiftsModule {}
