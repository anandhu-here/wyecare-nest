// apps/api/src/app/casl/casl.module.ts

import { Module } from '@nestjs/common';
import { AbilityFactory } from './abilities/ability.factory';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AbilityFactory],
  exports: [AbilityFactory],
})
export class CaslModule {}
