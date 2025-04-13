// libs/api/features/src/lib/parent-companies/schemas/parent-company.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Address } from '@wyecare-monorepo/types';

export type ParentCompanyDocument = ParentCompany & Document;

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

@Schema({ timestamps: true })
export class ParentCompany {
  @Prop({ required: true })
  name!: string;

  @Prop({ type: AddressSchema })
  address?: Address;

  @Prop({ required: true })
  phone!: string;

  @Prop({ required: true })
  email!: string;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Organization' }],
  })
  organizations?: MongooseSchema.Types.ObjectId[];
}

export const ParentCompanySchema = SchemaFactory.createForClass(ParentCompany);

// Add indexes
ParentCompanySchema.index({ name: 1 });
ParentCompanySchema.index({ email: 1 });
