// libs/api/features/src/lib/organizations/schemas/organization.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Address } from '@wyecare-monorepo/types';

export type OrganizationDocument = Organization & Document;

@Schema({ _id: false })
class AddressSchema implements Address {
  @Prop({ required: true })
  street!: string;

  @Prop({ required: true })
  city!: string;

  @Prop({ required: true })
  state!: string;

  @Prop({ required: true })
  zipCode!: string;

  @Prop({ required: true })
  country!: string;

  @Prop()
  countryCode?: string;

  @Prop()
  email?: string;
}

const AddressSchemaDefinition = SchemaFactory.createForClass(AddressSchema);

@Schema({ _id: false })
class NotificationProviderTemplate {
  @Prop()
  title?: string;

  @Prop()
  body?: string;

  @Prop({ default: true })
  active!: boolean;

  @Prop()
  subject?: string;
}

const NotificationProviderTemplateSchemaDefinition =
  SchemaFactory.createForClass(NotificationProviderTemplate);

@Schema({ _id: false })
class SmsProvider {
  @Prop({ default: false })
  enabled!: boolean;

  @Prop()
  fromNumber?: string;

  // Replace Map with a simple object for templates
  @Prop({ type: MongooseSchema.Types.Mixed })
  templates?: Record<string, any>;
}

@Schema({ _id: false })
class PushProvider {
  @Prop({ default: true })
  enabled!: boolean;

  // Replace Map with a simple object for templates
  @Prop({ type: MongooseSchema.Types.Mixed })
  templates?: Record<string, any>;
}

@Schema({ _id: false })
class EmailProvider {
  @Prop({ default: true })
  enabled!: boolean;

  @Prop()
  fromEmail?: string;

  // Replace Map with a simple object for templates
  @Prop({ type: MongooseSchema.Types.Mixed })
  templates?: Record<string, any>;
}

const SmsProviderSchemaDefinition = SchemaFactory.createForClass(SmsProvider);
const PushProviderSchemaDefinition = SchemaFactory.createForClass(PushProvider);
const EmailProviderSchemaDefinition =
  SchemaFactory.createForClass(EmailProvider);

@Schema({ _id: false })
class NotificationSettings {
  @Prop({
    type: {
      enabled: Boolean,
      providers: {
        twilio: { type: MongooseSchema.Types.Mixed },
      },
      quotaExceededAction: {
        type: String,
        enum: ['stop', 'notify', 'continue'],
        default: 'stop',
      },
    },
  })
  sms!: {
    enabled: boolean;
    providers: {
      twilio: any;
    };
    quotaExceededAction: 'stop' | 'notify' | 'continue';
  };

  @Prop({
    type: {
      enabled: Boolean,
      providers: {
        fcm: { type: MongooseSchema.Types.Mixed },
      },
      quotaExceededAction: {
        type: String,
        enum: ['stop', 'notify', 'continue'],
        default: 'notify',
      },
    },
  })
  push!: {
    enabled: boolean;
    providers: {
      fcm: any;
    };
    quotaExceededAction: 'stop' | 'notify' | 'continue';
  };

  @Prop({
    type: {
      enabled: Boolean,
      providers: {
        smtp: { type: MongooseSchema.Types.Mixed },
      },
    },
  })
  email!: {
    enabled: boolean;
    providers: {
      smtp: any;
    };
  };
}

const NotificationSettingsSchemaDefinition =
  SchemaFactory.createForClass(NotificationSettings);

@Schema({ timestamps: true })
export class Organization {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: false, enum: ['agency', 'home'] })
  type!: 'agency' | 'home';

  @Prop({
    required: true,
    enum: [
      'hospital',
      'staff_provider',
      'software_company',
      'manufacturing',
      'education',
      'retail',
      'logistics',
      'construction',
      'financial',
      'hospitality',
      'healthcare',
      'other',
    ],
  })
  category!:
    | 'hospital'
    | 'staff_provider'
    | 'software_company'
    | 'manufacturing'
    | 'education'
    | 'retail'
    | 'logistics'
    | 'construction'
    | 'financial'
    | 'hospitality'
    | 'healthcare'
    | 'other';

  @Prop()
  subCategory?: string;

  @Prop({ type: AddressSchemaDefinition })
  address?: Address;

  @Prop()
  phone?: string;

  @Prop()
  countryCode?: string;

  @Prop()
  email?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  admin!: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ParentCompany' })
  parentCompany?: MongooseSchema.Types.ObjectId;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  staff?: MongooseSchema.Types.ObjectId[];

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Organization' }],
  })
  linkedOrganizations?: MongooseSchema.Types.ObjectId[];

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'TemporaryHome' }],
  })
  linkedTemporaryHomes?: MongooseSchema.Types.ObjectId[];

  @Prop()
  avatarUrl?: string;

  @Prop()
  logoUrl?: string;

  @Prop()
  staffsRange?: string;

  @Prop()
  residentsRange?: string;

  @Prop({ default: false })
  residentManagementEnabled?: boolean;

  @Prop({ type: [String] })
  features?: string[];

  @Prop({ default: 0 })
  maxLinkedOrganizations?: number;

  @Prop({
    type: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
  })
  location?: {
    type: string;
    coordinates: number[];
  };

  @Prop()
  websiteUrl?: string;

  @Prop({
    type: {
      code: String,
      currency: String,
      region: {
        type: String,
        enum: ['IN', 'GLOBAL'],
        default: 'GLOBAL',
      },
    },
  })
  countryMetadata?: {
    code?: string;
    currency?: string;
    region?: 'IN' | 'GLOBAL';
  };

  @Prop({ type: NotificationSettingsSchemaDefinition })
  notificationSettings?: NotificationSettings;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);

// Add indexes
OrganizationSchema.index({ name: 1 });
OrganizationSchema.index({ type: 1 });
OrganizationSchema.index({ admin: 1 });
OrganizationSchema.index({ parentCompany: 1 });
OrganizationSchema.index({ 'address.city': 1, 'address.state': 1 });
