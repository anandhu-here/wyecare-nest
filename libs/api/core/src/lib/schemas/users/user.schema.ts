import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { Address } from '@wyecare-monorepo/types';

export type UserDocument = User &
  Document & {
    comparePassword(candidatePassword: string): Promise<boolean>;
    generateAuthToken(): string;
  };

@Schema({ _id: false })
class AddressSchema {
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

@Schema({ timestamps: true })
export class User {
  @Prop()
  avatarUrl?: string;

  @Prop({ required: true })
  firstName!: string;

  @Prop({ required: true })
  lastName!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ default: false })
  isSuperAdmin!: boolean;

  @Prop({ required: false })
  role!: string;

  @Prop({ type: AddressSchema })
  address?: AddressSchema;

  @Prop()
  timezone?: string;

  @Prop()
  gender?: string;

  @Prop({ default: false })
  emailVerified!: boolean;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  emailVerificationTokenExpires?: Date;

  @Prop({ required: true })
  phone!: string;

  @Prop({ required: true })
  countryCode!: string;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'OrganizationRole' }],
  })
  organizationRoles!: MongooseSchema.Types.ObjectId[];

  @Prop()
  passwordResetCode?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop({ default: false })
  accountDeletionRequested!: boolean;

  @Prop()
  accountDeletionRequestedAt?: Date;

  @Prop({ type: Object })
  countryMetadata?: {
    code?: string;
    currency?: string;
    region?: 'IN' | 'GLOBAL';
  };

  @Prop({ type: [String] })
  fcmTokens?: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add indexes
UserSchema.index({ email: 1 });
UserSchema.index({ lastName: 1, firstName: 1 });

// Add methods
// Add methods
UserSchema.methods['comparePassword'] = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this['password']);
};

UserSchema.methods['generateAuthToken'] = function (): string {
  return jwt.sign(
    { userId: this['_id'] },
    process.env['JWT_SECRET'] as string,
    {
      expiresIn: '1d',
    }
  );
};

// Add middleware (hooks)
UserSchema.pre('save', async function (next) {
  const user = this as unknown as UserDocument;
  if (!user.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});
