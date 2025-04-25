import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';
import { User, UserSchema } from 'libs/api/core/src/lib/schemas';
import {
  Organization,
  OrganizationSchema,
} from 'libs/api/core/src/lib/schemas';
import { PictureController } from './controllers/picture.controller';
import { PictureService } from './services/picture.service';
import { CoreModule } from '@wyecare-monorepo/core';
import { AuthorizationModule } from '../authorization/authorization.module';
import { FirebaseModule } from '../firebase/firebase.module';
// import { Resident, ResidentSchema } from 'libs/api/core/src/lib/schemas';
// import { CarerApplication, CarerApplicationSchema } from 'libs/api/core/src/lib/schemas';

@Module({
  imports: [
    CoreModule,

    // Configure Multer for file uploads
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
      },
    }),

    ConfigModule,
    AuthorizationModule,
    FirebaseModule,
  ],
  controllers: [PictureController],
  providers: [PictureService],
  exports: [PictureService],
})
export class PictureModule {}
