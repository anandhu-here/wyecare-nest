import { Module } from '@nestjs/common';
import { ModelsModule } from './schemas/models.module';
import { DatabaseModule } from './database/database.module';
import { FirebaseModule } from '../../../features/src/lib/firebase/firebase.module';

@Module({
  imports: [DatabaseModule, ModelsModule, FirebaseModule],
  exports: [ModelsModule, FirebaseModule],
})
export class CoreModule {}
