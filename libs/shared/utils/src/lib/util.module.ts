import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './services/email.service';
import { NotificationService } from './services/notification.service';
import { MongooseModule } from '@nestjs/mongoose';
import { FCMToken, FCMTokenSchema } from './schemas/fcm-token.schema';
import {
  NotificationHistory,
  NotificationHistorySchema,
} from './schemas/notification-history.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: FCMToken.name, schema: FCMTokenSchema },
      { name: NotificationHistory.name, schema: NotificationHistorySchema },
    ]),
  ],
  providers: [EmailService, NotificationService],
  exports: [EmailService, NotificationService],
})
export class UtilsModule {}
