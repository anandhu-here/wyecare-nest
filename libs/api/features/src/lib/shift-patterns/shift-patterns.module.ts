import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShiftPatternsController } from './controllers/shift-patterns.controller';
import { ShiftPatternsService } from './services/shift-patterns.service';
import {
  ShiftPattern,
  ShiftPatternSchema,
} from './schemas/shift-pattern.schema';
import { OrganizationsModule } from '../organizations/organizations.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShiftPattern.name, schema: ShiftPatternSchema },
    ]),
    OrganizationsModule,
    AuthorizationModule,
  ],
  controllers: [ShiftPatternsController],
  providers: [ShiftPatternsService],
  exports: [ShiftPatternsService],
})
export class ShiftPatternsModule {}
