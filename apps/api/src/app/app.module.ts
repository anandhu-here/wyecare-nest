// apps/api/src/app/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from '@wyecare-monorepo/api/core';
import { FeaturesModule } from '@wyecare-monorepo/features';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig, appConfig } from '@wyecare-monorepo/shared/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig],
    }),
    CoreModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
