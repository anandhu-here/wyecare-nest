// temp-organization.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import {
  Invoice,
  Organization,
  Shift,
  ShiftPattern,
  TemporaryHome,
  TemporaryHomeDocument,
  Timesheet,
} from 'libs/api/core/src/lib/schemas';

@Injectable()
export class TemporaryHomeService {
  constructor(
    @InjectModel(TemporaryHome.name)
    private temporaryHomeModel: Model<TemporaryHomeDocument>,
    @InjectModel(Organization.name)
    private organizationModel: Model<any>,
    @InjectModel(Shift.name)
    private shiftModel: Model<any>,
    @InjectModel(Timesheet.name)
    private timesheetModel: Model<any>,
    @InjectModel(Invoice.name)
    private invoiceModel: Model<any>,
    @InjectModel(ShiftPattern.name)
    private shiftPatternModel: Model<any>
  ) {}

  private generateTemporaryId(agencyId: string): string {
    // Extract the last 8 chars of the agency ID
    const shortAgencyId = agencyId.substring(agencyId.length - 8);

    // Generate a random 6-character string
    const randomStr = crypto.randomBytes(3).toString('hex');

    // Combine with a prefix
    return `TCHOME-${shortAgencyId}-${randomStr}`;
  }

  /**
   * Create a new temporary care home
   */
  async createTemporaryHome(params: {
    name: string;
    agencyId: string;
    createdBy: string;
  }): Promise<any> {
    try {
      const { name, agencyId, createdBy } = params;

      // Validate agency exists
      const agency = await this.organizationModel.findById(agencyId);
      if (!agency) {
        throw new Error('Agency not found');
      }

      // Generate a unique temporary ID
      const temporaryId = this.generateTemporaryId(agencyId);

      // Create the temporary home
      const tempHome: any = new this.temporaryHomeModel({
        name,
        createdByAgency: new Types.ObjectId(agencyId),
        temporaryId,
        metadata: {
          createdBy: new Types.ObjectId(createdBy),
          createdAt: new Date(),
        },
      });

      await tempHome.save();

      // Automatically link the temp home to the agency
      await this.organizationModel.findByIdAndUpdate(agencyId, {
        $addToSet: { linkedTemporaryHomes: tempHome._id },
      });

      return tempHome;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Get all temporary homes created by an agency
   */
  async getAgencyTemporaryHomes(agencyId: string): Promise<any[]> {
    return this.temporaryHomeModel
      .find({
        createdByAgency: new Types.ObjectId(agencyId),
        isClaimed: false,
      })
      .sort({ createdAt: -1 });
  }

  /**
   * Get temporary home by ID
   */
  async getTemporaryHomeById(tempHomeId: string): Promise<any> {
    return this.temporaryHomeModel.findById(tempHomeId);
  }

  /**
   * Get temporary home by its unique temporary ID
   */
  async getTemporaryHomeByTempId(temporaryId: string): Promise<any> {
    return this.temporaryHomeModel.findOne({ temporaryId });
  }

  /**
   * Update temporary home details
   */
  async updateTemporaryHome(params: {
    tempHomeId: string;
    name?: string;
    metadata?: any;
  }): Promise<any> {
    const { tempHomeId, name, metadata } = params;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (metadata) updateData.metadata = metadata;

    return this.temporaryHomeModel.findByIdAndUpdate(
      tempHomeId,
      { $set: updateData },
      { new: true }
    );
  }

  /**
   * Delete a temporary home
   */
  async deleteTemporaryHome(tempHomeId: string): Promise<boolean> {
    const result = await this.temporaryHomeModel.findByIdAndDelete(tempHomeId);
    return !!result;
  }

  /**
   * Claim a temporary home and migrate its data
   */
  async claimTemporaryHome(params: {
    temporaryId: string;
    homeId: string;
  }): Promise<any> {
    const { temporaryId, homeId } = params;

    // Find the temporary home
    const tempHome: any = await this.temporaryHomeModel.findOne({
      temporaryId,
      isClaimed: false,
    });

    if (!tempHome) {
      throw new Error('Temporary home not found or already claimed');
    }

    // Get the agency ID
    const agencyId = tempHome.createdByAgency.toString();

    // Validate real home exists
    const realHome = await this.organizationModel.findById(homeId);
    if (!realHome) {
      throw new Error('Care home not found');
    }

    // Validate agency exists
    const agency = await this.organizationModel.findById(agencyId);
    if (!agency) {
      throw new Error('Agency not found');
    }

    // 1. Migrate shifts
    const shiftUpdateResult = await this.shiftModel.updateMany(
      { homeId: tempHome._id },
      {
        homeId: new Types.ObjectId(homeId),
        isTemporaryHome: false,
        temporaryHomeId: null,
      }
    );

    // 2. Migrate timesheets
    const timesheetUpdateResult = await this.timesheetModel.updateMany(
      { home: tempHome._id },
      { home: new Types.ObjectId(homeId) }
    );

    // 3. Migrate invoices
    const invoiceUpdateResult = await this.invoiceModel.updateMany(
      { homeId: tempHome._id },
      { homeId: new Types.ObjectId(homeId) }
    );

    // 4. Link the agency and home
    await this.organizationModel.findByIdAndUpdate(agencyId, {
      $addToSet: { linkedOrganizations: new Types.ObjectId(homeId) },
    });

    await this.organizationModel.findByIdAndUpdate(homeId, {
      $addToSet: { linkedOrganizations: new Types.ObjectId(agencyId) },
    });

    await this.shiftPatternModel.updateMany(
      { 'rates.careHomeId': tempHome._id.toString() },
      { $set: { 'rates.$[elem].careHomeId': homeId } },
      { arrayFilters: [{ 'elem.careHomeId': tempHome._id.toString() }] }
    );

    // Update timings
    await this.shiftPatternModel.updateMany(
      { 'timings.careHomeId': tempHome._id.toString() },
      { $set: { 'timings.$[elem].careHomeId': homeId } },
      { arrayFilters: [{ 'elem.careHomeId': tempHome._id.toString() }] }
    );

    // 5. Mark temporary home as claimed
    tempHome.isClaimed = true;
    tempHome.claimedBy = new Types.ObjectId(homeId);
    await tempHome.save();

    return {
      tempHome,
      migrationStats: {
        shifts: shiftUpdateResult.modifiedCount,
        timesheets: timesheetUpdateResult.modifiedCount,
        invoices: invoiceUpdateResult.modifiedCount,
        linked: true,
      },
    };
  }

  /**
   * Unclaim a temporary home and revert migrations
   */
  async unclaimTemporaryHome(params: {
    tempHomeId: string;
    agency: boolean;
    requestingOrgId?: string;
  }): Promise<any> {
    const { tempHomeId, agency, requestingOrgId } = params;

    const tempHome: any = await this.temporaryHomeModel.findById(tempHomeId);

    if (!tempHome) {
      throw new Error('Temporary home not found');
    }

    if (!tempHome.isClaimed) {
      throw new Error('Temporary home is not claimed');
    }

    const homeId = tempHome.claimedBy.toString();

    const realHome = await this.organizationModel.findById(homeId);
    if (!realHome) {
      throw new Error('Care home not found');
    }

    const agencyId = tempHome.createdByAgency.toString();

    // Validate agency exists
    const agencyOrg = await this.organizationModel.findById(agencyId);
    if (!agencyOrg) {
      throw new Error('Agency not found');
    }

    // Access control checks
    if (!agency) {
      // If request is from a care home, make sure it's the same home that claimed it
      if (requestingOrgId && homeId !== requestingOrgId) {
        throw new Error('You can only unclaim your own temporary homes');
      }
    } else {
      // If request is from an agency, make sure it's the agency that created the temp home
      if (requestingOrgId && agencyId !== requestingOrgId) {
        throw new Error(
          'You can only unclaim temporary homes created by your agency'
        );
      }
    }

    // 1. Revert shifts migration
    const shiftUpdateResult = await this.shiftModel.updateMany(
      { homeId: new Types.ObjectId(homeId) },
      { homeId: new Types.ObjectId(tempHome._id) }
    );

    // 2. Revert timesheets migration
    const timesheetUpdateResult = await this.timesheetModel.updateMany(
      { home: new Types.ObjectId(homeId) },
      { home: new Types.ObjectId(tempHome._id) }
    );

    // 3. Revert invoices migration
    const invoiceUpdateResult = await this.invoiceModel.updateMany(
      { homeId: new Types.ObjectId(homeId) },
      { homeId: new Types.ObjectId(tempHome._id) }
    );

    // 4. Revert ShiftType rates and timings migration
    const shiftTypeUpdateResult = await this.shiftPatternModel.updateMany(
      { 'rates.careHomeId': homeId },
      { $set: { 'rates.$[elem].careHomeId': tempHome._id.toString() } },
      { arrayFilters: [{ 'elem.careHomeId': homeId }] }
    );

    // Update timings
    const shiftTypeTimingsUpdateResult =
      await this.shiftPatternModel.updateMany(
        { 'timings.careHomeId': homeId },
        { $set: { 'timings.$[elem].careHomeId': tempHome._id.toString() } },
        { arrayFilters: [{ 'elem.careHomeId': homeId }] }
      );

    // 5. Unlink the agency and home
    await this.organizationModel.findByIdAndUpdate(agencyId, {
      $pull: { linkedOrganizations: new Types.ObjectId(homeId) },
    });

    await this.organizationModel.findByIdAndUpdate(homeId, {
      $pull: { linkedOrganizations: new Types.ObjectId(agencyId) },
    });

    // 6. Mark temporary home as unclaimed
    tempHome.isClaimed = false;
    tempHome.claimedBy = null;
    tempHome.metadata = tempHome.metadata || {};
    tempHome.metadata.unclaimedAt = new Date();
    await tempHome.save();

    return {
      tempHome,
      reversionStats: {
        shifts: shiftUpdateResult.modifiedCount,
        timesheets: timesheetUpdateResult.modifiedCount,
        invoices: invoiceUpdateResult.modifiedCount,
        shiftTypes:
          shiftTypeUpdateResult.modifiedCount +
          shiftTypeTimingsUpdateResult.modifiedCount,
        unlinked: true,
      },
    };
  }

  /**
   * Verify if a temporary ID is valid and available to claim
   */
  async verifyTemporaryId(temporaryId: string): Promise<{
    isValid: boolean;
    tempHome?: any;
    agency?: any;
  }> {
    try {
      const tempHome: any = await this.temporaryHomeModel.findOne({
        temporaryId,
      });

      if (!tempHome) {
        return { isValid: false };
      }

      if (tempHome.isClaimed) {
        return { isValid: false, tempHome };
      }

      const agency = await this.organizationModel.findById(
        tempHome.createdByAgency
      );

      return {
        isValid: true,
        tempHome,
        agency,
      };
    } catch (error) {
      throw new Error('Error verifying temporary ID');
    }
  }

  /**
   * Get statistics about a temporary home (shifts, timesheets, invoices)
   */
  async getTemporaryHomeStats(tempHomeId: string): Promise<any> {
    const tempHome: any = await this.temporaryHomeModel.findById(tempHomeId);

    if (!tempHome) {
      throw new Error('Temporary home not found');
    }

    const shiftsCount = await this.shiftModel.countDocuments({
      homeId: tempHomeId,
    });
    const timesheetsCount = await this.timesheetModel.countDocuments({
      home: tempHomeId,
    });
    const invoicesCount = await this.invoiceModel.countDocuments({
      homeId: tempHomeId,
    });

    return {
      tempHome,
      stats: {
        shifts: shiftsCount,
        timesheets: timesheetsCount,
        invoices: invoicesCount,
      },
    };
  }
}
