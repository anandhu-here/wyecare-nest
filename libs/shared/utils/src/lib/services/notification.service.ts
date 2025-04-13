import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as admin from 'firebase-admin';
import { FCMToken, FCMTokenDocument } from '../schemas/fcm-token.schema';
import {
  NotificationHistory,
  NotificationHistoryDocument,
} from '../schemas/notification-history.schema';
import { ConfigService } from '@nestjs/config';

interface NotificationData {
  [key: string]: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private fcmApp: any;
  private readonly batchSize = 500; // FCM has a limit of 500 recipients per batch

  constructor(
    @InjectModel(FCMToken.name) private fcmTokenModel: Model<FCMTokenDocument>,
    @InjectModel(NotificationHistory.name)
    private notificationHistoryModel: Model<NotificationHistoryDocument>,
    private configService: ConfigService
  ) {
    this.initializeFirebaseApp();
  }

  /**
   * Initialize Firebase Admin SDK if not already initialized
   */
  private initializeFirebaseApp(): void {
    try {
      // Check if app already exists
      this.fcmApp = admin.app();
    } catch (error: any) {
      // Initialize with service account credentials
      const serviceAccount = JSON.parse(
        this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT') || '{}'
      );

      if (!serviceAccount.project_id) {
        this.logger.warn(
          'Firebase service account not configured. Push notifications will be disabled.'
        );
        return;
      }

      this.fcmApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      this.logger.log('Firebase Admin SDK initialized successfully');
    }
  }

  /**
   * Send notification to multiple users by user IDs
   */
  async sendNotification(
    userIds: Types.ObjectId[] | string[],
    title: string,
    body: string,
    data?: NotificationData,
    silent: boolean = false
  ): Promise<void> {
    try {
      if (!this.fcmApp) {
        this.logger.warn(
          'Firebase app not initialized. Skipping notification.'
        );
        return;
      }

      // Convert string IDs to ObjectIds if needed
      const userObjectIds = userIds.map((id) =>
        typeof id === 'string' ? new Types.ObjectId(id) : id
      );

      // Get FCM tokens for all users
      const fcmTokens = await this.fcmTokenModel
        .find({
          user: { $in: userObjectIds },
          isActive: true,
        })
        .exec();

      if (!fcmTokens || fcmTokens.length === 0) {
        this.logger.debug(
          `No FCM tokens found for users: ${userIds.join(', ')}`
        );
        return;
      }

      // Extract token strings from FCM token documents
      const tokens = fcmTokens.map((token) => token.token);

      // Send notifications in batches to avoid FCM limitations
      await this.sendNotificationByTokens(tokens, title, body, data, silent);

      // Save notification history
      await this.saveNotificationHistory(userObjectIds, title, body, data);
    } catch (error: any) {
      this.logger.error(
        `Error sending notification: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Send notification by device tokens with batching
   */
  private async sendNotificationByTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: NotificationData,
    silent: boolean = false
  ): Promise<void> {
    if (tokens.length === 0) {
      return;
    }

    try {
      // Create message payload
      const message: admin.messaging.MulticastMessage = {
        tokens: tokens.slice(0, this.batchSize),
        notification: silent
          ? undefined
          : {
              title,
              body,
            },
        data: data || {},
        android: {
          priority: 'high',
          notification: silent
            ? undefined
            : {
                channelId: 'default',
                clickAction: 'FLUTTER_NOTIFICATION_CLICK',
              },
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
              sound: silent ? undefined : 'default',
              badge: 1,
            },
          },
        },
      };

      // Send batch message
      const response = await admin.messaging().sendMulticast(message);

      // Log success/failure
      this.logger.debug(
        `Sent notifications to ${response.successCount} devices and failed to send to ${response.failureCount} devices`
      );

      // Clean up invalid tokens
      if (response.failureCount > 0) {
        const failedTokens = response.responses
          .map((resp, idx) => (resp.success ? null : tokens[idx]))
          .filter((token) => token !== null);

        await this.cleanupInvalidTokens(failedTokens);
      }

      // Process remaining tokens recursively
      if (tokens.length > this.batchSize) {
        await this.sendNotificationByTokens(
          tokens.slice(this.batchSize),
          title,
          body,
          data,
          silent
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Error sending FCM notifications: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Clean up invalid/expired tokens
   */
  private async cleanupInvalidTokens(invalidTokens: string[]): Promise<void> {
    if (!invalidTokens || invalidTokens.length === 0) {
      return;
    }

    try {
      // Mark tokens as inactive rather than deleting them
      const result = await this.fcmTokenModel.updateMany(
        { token: { $in: invalidTokens } },
        { isActive: false, deactivatedAt: new Date() }
      );

      this.logger.debug(
        `Marked ${result.modifiedCount} invalid FCM tokens as inactive`
      );
    } catch (error: any) {
      this.logger.error(
        `Error cleaning up invalid tokens: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Save notification history for tracking and analytics
   */
  private async saveNotificationHistory(
    userIds: Types.ObjectId[],
    title: string,
    body: string,
    data?: NotificationData
  ): Promise<void> {
    try {
      // Create notification history records in bulk
      const historyEntries = userIds.map((userId) => ({
        userId,
        title,
        body,
        data: data || {},
        sentAt: new Date(),
        isRead: false,
      }));

      await this.notificationHistoryModel.insertMany(historyEntries);
    } catch (error: any) {
      this.logger.error(
        `Error saving notification history: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Send a notification to a specific topic
   */
  async sendTopicNotification(
    topic: string,
    title: string,
    body: string,
    data?: NotificationData,
    silent: boolean = false
  ): Promise<void> {
    try {
      if (!this.fcmApp) {
        this.logger.warn(
          'Firebase app not initialized. Skipping notification.'
        );
        return;
      }

      // Create message payload
      const message: admin.messaging.Message = {
        topic,
        notification: silent
          ? undefined
          : {
              title,
              body,
            },
        data: data || {},
        android: {
          priority: 'high',
          notification: silent
            ? undefined
            : {
                channelId: 'default',
                clickAction: 'FLUTTER_NOTIFICATION_CLICK',
              },
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
              sound: silent ? undefined : 'default',
            },
          },
        },
      };

      // Send message
      const response = await admin.messaging().send(message);
      this.logger.debug(`Topic notification sent: ${response}`);
    } catch (error: any) {
      this.logger.error(
        `Error sending topic notification: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Subscribe a set of tokens to a topic
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    try {
      if (!this.fcmApp) {
        this.logger.warn(
          'Firebase app not initialized. Skipping subscription.'
        );
        return;
      }

      // FCM allows max 1000 tokens per call
      const batchSize = 1000;

      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        await admin.messaging().subscribeToTopic(batch, topic);
      }

      this.logger.debug(
        `Subscribed ${tokens.length} tokens to topic: ${topic}`
      );
    } catch (error: any) {
      this.logger.error(
        `Error subscribing to topic: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Unsubscribe a set of tokens from a topic
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    try {
      if (!this.fcmApp) {
        this.logger.warn(
          'Firebase app not initialized. Skipping unsubscription.'
        );
        return;
      }

      // FCM allows max 1000 tokens per call
      const batchSize = 1000;

      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        await admin.messaging().unsubscribeFromTopic(batch, topic);
      }

      this.logger.debug(
        `Unsubscribed ${tokens.length} tokens from topic: ${topic}`
      );
    } catch (error: any) {
      this.logger.error(
        `Error unsubscribing from topic: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Register a new FCM token for a user
   */
  async registerFCMToken(
    userId: Types.ObjectId,
    token: string,
    deviceInfo: {
      platform: string;
      model?: string;
      osVersion?: string;
      appVersion?: string;
      identifier?: string;
    }
  ): Promise<FCMToken> {
    try {
      // Check if token already exists
      const existingToken = await this.fcmTokenModel
        .findOne({
          token,
          isActive: true,
        })
        .exec();

      if (existingToken) {
        // Update the user ID if token exists but for a different user
        if (existingToken.user.toString() !== userId.toString()) {
          existingToken.user = userId as any;
          existingToken.device = { ...deviceInfo };
          existingToken.updatedAt = new Date();
          return await existingToken.save();
        }

        // Token already registered for this user
        return existingToken;
      }

      // Create a new token record
      const newToken = new this.fcmTokenModel({
        user: userId,
        token,
        device: deviceInfo,
        isActive: true,
        createdAt: new Date(),
      });

      return await newToken.save();
    } catch (error: any) {
      this.logger.error(
        `Error registering FCM token: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Unregister an FCM token
   */
  async unregisterFCMToken(token: string): Promise<void> {
    try {
      await this.fcmTokenModel.updateOne(
        { token },
        { isActive: false, deactivatedAt: new Date() }
      );
    } catch (error: any) {
      this.logger.error(
        `Error unregistering FCM token: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadNotificationCount(userId: Types.ObjectId): Promise<number> {
    try {
      return await this.notificationHistoryModel.countDocuments({
        userId,
        isRead: false,
      });
    } catch (error: any) {
      this.logger.error(
        `Error getting unread notification count: ${error.message}`,
        error.stack
      );
      return 0;
    }
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsAsRead(
    userId: Types.ObjectId,
    notificationIds?: Types.ObjectId[]
  ): Promise<void> {
    try {
      const query: any = { userId };

      // If specific notification IDs are provided, only mark those as read
      if (notificationIds && notificationIds.length > 0) {
        query._id = { $in: notificationIds };
      }

      await this.notificationHistoryModel.updateMany(query, {
        isRead: true,
        readAt: new Date(),
      });
    } catch (error: any) {
      this.logger.error(
        `Error marking notifications as read: ${error.message}`,
        error.stack
      );
    }
  }
}
