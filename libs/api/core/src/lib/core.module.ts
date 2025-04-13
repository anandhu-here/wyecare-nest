// libs/api/core/src/lib/core.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { FeaturesModule } from '@wyecare-monorepo/features';

@Module({
  imports: [DatabaseModule, FeaturesModule],
  exports: [DatabaseModule, FeaturesModule],
})
export class CoreModule {}
