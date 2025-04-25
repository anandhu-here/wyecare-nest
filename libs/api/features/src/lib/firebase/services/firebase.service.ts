import { Module, Global, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private logEnvironmentSetup() {
    console.log('\n========== FIREBASE ENVIRONMENT SETUP ==========');
    console.log(
      `NODE_ENV: "${this.configService.get<string>('NODE_ENV') || 'not set'}"`
    );
    console.log(
      `FIREBASE_PROJECT_ID: "${
        this.configService.get<string>('FIREBASE_PROJECT_ID') || 'not set'
      }"`
    );
    console.log(
      `FIREBASE_STORAGE_BUCKET: "${
        this.configService.get<string>('FIREBASE_STORAGE_BUCKET') || 'not set'
      }"`
    );
    console.log(
      `FIREBASE_STORAGE_EMULATOR_HOST: "${
        this.configService.get<string>('FIREBASE_STORAGE_EMULATOR_HOST') ||
        'not set'
      }"`
    );
    console.log(
      `process.env.FIREBASE_STORAGE_EMULATOR_HOST: "${
        process.env['FIREBASE_STORAGE_EMULATOR_HOST'] || 'not set'
      }"`
    );
    console.log(
      `Firebase Admin initialized: ${admin.apps.length > 0 ? 'Yes' : 'No'}`
    );
    console.log('================================================\n');
  }

  private initializeFirebase() {
    console.log('Starting Firebase initialization...');

    const environment =
      this.configService.get<string>('NODE_ENV') || 'development';
    console.log(`Detected environment: ${environment}`);

    if (admin.apps.length > 0) {
      console.log('Firebase already initialized, skipping initialization');
      this.logEnvironmentSetup();
      return;
    }

    // Basic configuration for both environments
    const firebaseConfig = {
      projectId:
        this.configService.get<string>('FIREBASE_PROJECT_ID') || 'demo-local',
      storageBucket:
        this.configService.get<string>('FIREBASE_STORAGE_BUCKET') ||
        'demo-local.appspot.com',
    };

    console.log('Firebase config:', JSON.stringify(firebaseConfig, null, 2));

    // Initialize Firebase with the config
    admin.initializeApp(firebaseConfig);
    console.log('Firebase Admin SDK initialized successfully');

    // Set up emulator if in development
    if (environment === 'development' || environment === 'local') {
      const emulatorHost =
        this.configService.get<string>('FIREBASE_STORAGE_EMULATOR_HOST') ||
        'localhost:9199';
      console.log(`Setting up emulator host: ${emulatorHost}`);
      process.env['FIREBASE_STORAGE_EMULATOR_HOST'] = emulatorHost;
      console.log(
        `process.env.FIREBASE_STORAGE_EMULATOR_HOST now set to: ${process.env['FIREBASE_STORAGE_EMULATOR_HOST']}`
      );
    }

    this.logEnvironmentSetup();
  }

  getStorage() {
    return admin.storage();
  }

  getStorageBucket(bucketName?: string) {
    return admin.storage().bucket(bucketName);
  }

  getDefaultBucket() {
    const defaultBucket = this.configService.get<string>(
      'FIREBASE_STORAGE_BUCKET'
    );
    return admin.storage().bucket(defaultBucket);
  }
}
