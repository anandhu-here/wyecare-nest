import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import moment from 'moment';
import { InvoiceFilterDto } from '../dto/invoice-filter.dto';
import { EventBusService } from '../../events/services/event-bus.service';
import {
  Invoice,
  InvoiceDocument,
  Organization,
  TemporaryHome,
  Timesheet,
} from 'libs/api/core/src/lib/schemas';

// Define types
type TimesheetStatus = 'pending_invoice' | 'invoiced' | 'paid' | 'approved';
type InvoiceStatus =
  | 'draft'
  | 'pending'
  | 'sent'
  | 'paid'
  | 'cancelled'
  | 'partially_paid'
  | 'accepted'
  | 'rejected'
  | 'invalidated';

interface StatusTransition {
  nextStatuses: InvoiceStatus[];
  timesheetStatus?: TimesheetStatus;
  notificationType?: string;
  notificationTitle?: string;
}

interface ShiftSummaryItem {
  count: number;
  totalHours?: number;
  weekdayHours: number;
  weekendHours: number;
  holidayHours: number;
  emergencyHours: number;
  weekdayRate: number;
  weekendRate: number;
  holidayRate: number;
  emergencyRate: number;
  totalAmount: number;
}

interface InvoiceTimesheet {
  _id: string;
  hourlyRate: number;
  hours: number;
  amount: number;
  shiftDate: string;
  shiftType: string;
  carerName: string;
  homeName: string;
  isEmergency: boolean;
  isHoliday?: boolean;
  isWeekend?: boolean;
  signature?: any;
  timing?: any;
  totalHours?: number;
  breakHours?: number;
}

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  // Status transitions map for validation
  private readonly STATUS_TRANSITIONS: Record<InvoiceStatus, StatusTransition> =
    {
      pending: {
        nextStatuses: ['accepted', 'rejected', 'cancelled'],
        timesheetStatus: 'pending_invoice',
      },
      accepted: {
        nextStatuses: ['paid', 'invalidated', 'cancelled'],
        timesheetStatus: 'invoiced',
        notificationType: 'INVOICE_ACCEPTED',
        notificationTitle: 'Invoice Accepted',
      },
      rejected: {
        nextStatuses: ['pending', 'cancelled'],
        timesheetStatus: 'approved',
        notificationType: 'INVOICE_REJECTED',
        notificationTitle: 'Invoice Rejected',
      },
      paid: {
        nextStatuses: ['invalidated', 'cancelled'],
        notificationType: 'INVOICE_PAID',
        notificationTitle: 'Invoice Paid',
      },
      cancelled: {
        nextStatuses: [],
        notificationTitle: 'Invoice Cancelled',
        notificationType: 'INVOICE_CANCELLED',
      },
      invalidated: {
        nextStatuses: [],
        notificationTitle: 'Invoice Invalidated',
        notificationType: 'INVOICE_INVALIDATED',
      },
      partially_paid: {
        nextStatuses: ['paid', 'invalidated', 'cancelled'],
      },
      sent: {
        nextStatuses: ['pending', 'invalidated'],
        notificationTitle: 'Invoice Sent',
        notificationType: 'INVOICE_SENT',
      },
      draft: {
        nextStatuses: ['sent', 'invalidated'],
      },
    };

  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    @InjectModel(Timesheet.name) private timesheetModel: Model<any>,
    @InjectModel(Organization.name) private organizationModel: Model<any>,
    @InjectModel(TemporaryHome.name) private temporaryHomeModel: Model<any>,
    private eventBusService: EventBusService
  ) {}

  async createInvoice(params: {
    agencyId: string;
    homeId: string;
    startDate: string;
    endDate: string;
    timesheets: string[];
    totalAmount: number;
    shiftSummary?: Record<string, any>;
    isTemporaryHome?: boolean;
    temporaryHomeId?: string;
    homeDetails?: any;
  }): Promise<any> {
    try {
      const {
        agencyId,
        homeId,
        startDate,
        endDate,
        timesheets,
        totalAmount,
        shiftSummary,
        isTemporaryHome,
        temporaryHomeId,
        homeDetails,
      } = params;

      // Log the incoming shift summary to debug
      this.logger.debug(
        'Incoming shiftSummary:',
        JSON.stringify(shiftSummary, null, 2)
      );

      // Check for existing invoices
      await this.checkExistingInvoice(timesheets, startDate, endDate);

      // Format the shift summary
      const formattedShiftSummary = this.formatShiftSummary(shiftSummary || {});

      // Generate invoice number
      const invoiceNumber = this.generateInvoiceNumber();

      // Create the invoice document
      const invoiceData: any = {
        invoiceNumber,
        agencyId: new Types.ObjectId(agencyId),
        homeId: new Types.ObjectId(homeId),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalAmount,
        shiftSummary: this.convertShiftSummaryToMap(formattedShiftSummary),
        status: 'pending',
        timesheetIds: timesheets,
        createdAt: new Date(),
      };

      // Add temporary home fields if provided
      if (isTemporaryHome) {
        invoiceData.isTemporaryHome = true;

        if (temporaryHomeId) {
          invoiceData.temporaryHomeId = temporaryHomeId;
        }

        if (homeDetails) {
          invoiceData.homeDetails = homeDetails;
        }
      }

      // Create and save the invoice
      const invoice: any = new this.invoiceModel(invoiceData);
      const savedInvoice = await invoice.save();

      // Prepare notification payload
      const notificationPayload = this.prepareInvoiceNotificationPayload(
        savedInvoice._id.toString()
      );

      // Populate the invoice response
      let populatedInvoice: any;

      if (isTemporaryHome) {
        // For temporary homes, just populate the agency
        populatedInvoice = await this.invoiceModel
          .findById(savedInvoice._id)
          .populate('agencyId', '_id name email phone address logoUrl');

        // Use the homeDetails directly
        if (homeDetails) {
          populatedInvoice.homeId = {
            _id: homeId,
            ...homeDetails,
          };
        }
      } else {
        // For regular homes, populate both agency and home
        populatedInvoice = await this.invoiceModel
          .findById(savedInvoice._id)
          .populate('agencyId', '_id name email phone address logoUrl')
          .populate('homeId', '_id name email phone address');
      }

      // Update timesheets with invoice information
      await this.updateTimesheetsStatus(
        timesheets,
        null,
        savedInvoice._id.toString(),
        invoiceNumber
      );

      // Emit event for invoice creation
      //   this.eventBusService.emit('invoice.created', {
      //     invoiceId: savedInvoice._id,
      //     agencyId: savedInvoice.agencyId,
      //     homeId: savedInvoice.homeId,
      //     amount: savedInvoice.totalAmount,
      //     status: savedInvoice.status
      //   });

      return populatedInvoice;
    } catch (error: any) {
      this.logger.error('Error creating invoice:', {
        error: error.message,
        stack: error.stack,
        params: { ...params, timesheets: params.timesheets.length },
      });
      throw error;
    }
  }

  async getInvoices(
    organizationId: string,
    page: number,
    limit: number,
    filter: InvoiceFilterDto
  ): Promise<{ invoices: any[]; total: number }> {
    try {
      const objectId = new Types.ObjectId(organizationId);
      const skip = (page - 1) * limit;

      let baseQuery: any = {
        $or: [{ agencyId: objectId }, { homeId: objectId }],
      };

      if (filter.status && filter.status !== 'all') {
        baseQuery['status'] = filter.status;
      }

      // Add date range filter if provided
      if (filter.startDate && filter.endDate) {
        baseQuery['createdAt'] = {
          $gte: new Date(filter.startDate),
          $lte: new Date(filter.endDate),
        };
      }

      // For search, we need to use aggregation to search in populated fields
      let pipeline: any[] = [];

      // Start with the match stage for base query
      pipeline.push({ $match: baseQuery });

      // Lookup stages for populating references
      pipeline.push(
        {
          $lookup: {
            from: 'organizations',
            localField: 'agencyId',
            foreignField: '_id',
            as: 'agencyDetails',
          },
        },
        {
          $lookup: {
            from: 'organizations',
            localField: 'homeId',
            foreignField: '_id',
            as: 'homeDetails',
          },
        },
        // Include a lookup for temporary homes
        {
          $lookup: {
            from: 'temporaryhomes',
            localField: 'homeId',
            foreignField: '_id',
            as: 'tempHomeDetails',
          },
        },
        {
          $addFields: {
            agency: { $arrayElemAt: ['$agencyDetails', 0] },
            // For home, handle both regular and temporary homes
            home: {
              $cond: {
                if: '$isTemporaryHome',
                then: {
                  $cond: {
                    if: { $gt: [{ $size: '$tempHomeDetails' }, 0] },
                    then: {
                      _id: { $arrayElemAt: ['$tempHomeDetails._id', 0] },
                      name: {
                        $concat: [
                          { $arrayElemAt: ['$tempHomeDetails.name', 0] },
                          ' (Temporary)',
                        ],
                      },
                      email: { $arrayElemAt: ['$tempHomeDetails.email', 0] },
                      phone: { $arrayElemAt: ['$tempHomeDetails.phone', 0] },
                      address: {
                        $arrayElemAt: ['$tempHomeDetails.address', 0],
                      },
                    },
                    else: {
                      $cond: {
                        if: { $ne: ['$homeDetails', null] },
                        then: '$homeDetails',
                        else: {
                          _id: '$homeId',
                          name: 'Temporary Home',
                          email: '',
                          phone: '',
                          address: {},
                        },
                      },
                    },
                  },
                },
                else: { $arrayElemAt: ['$homeDetails', 0] },
              },
            },
          },
        }
      );

      // Add search filter if provided
      if (filter.search) {
        const searchRegex = new RegExp(filter.search, 'i');
        pipeline.push({
          $match: {
            $or: [
              { invoiceNumber: searchRegex },
              { 'agency.name': searchRegex },
              { 'home.name': searchRegex },
            ],
          },
        });
      }

      // Add sort stage
      pipeline.push({ $sort: { createdAt: -1 } });

      // Get total count
      const countPipeline = [...pipeline, { $count: 'total' }];
      const totalResult = await this.invoiceModel.aggregate(countPipeline);
      const total = totalResult[0]?.total || 0;

      // Add pagination stages
      pipeline.push(
        { $skip: skip },
        { $limit: limit },
        // Project final shape of documents
        {
          $project: {
            _id: 1,
            invoiceNumber: 1,
            status: 1,
            totalAmount: 1,
            createdAt: 1,
            isTemporaryHome: 1,
            agencyId: {
              _id: '$agency._id',
              name: '$agency.name',
              email: '$agency.email',
              address: '$agency.address',
              logoUrl: '$agency.logoUrl',
            },
            homeId: {
              _id: '$home._id',
              name: '$home.name',
              email: '$home.email',
              address: '$home.address',
              logoUrl: '$home.logoUrl',
            },
          },
        }
      );

      const invoices = await this.invoiceModel.aggregate(pipeline);

      return {
        invoices,
        total,
      };
    } catch (error: any) {
      this.logger.error('Error getting invoices:', {
        error: error.message,
        stack: error.stack,
        organizationId,
        filter,
      });
      throw error;
    }
  }

  async getInvoiceById(invoiceId: string): Promise<any> {
    try {
      // First get the invoice with agency details
      const invoice: any = await this.invoiceModel
        .findById(invoiceId)
        .populate({
          path: 'agencyId',
          select: 'name email phone address logoUrl',
        });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      // Check if this is a temporary home invoice
      if (invoice.isTemporaryHome) {
        // If we already have homeDetails stored, use those
        if (
          invoice.homeDetails &&
          Object.keys(invoice.homeDetails).length > 0
        ) {
          // Use the stored home details
          invoice.homeId = {
            _id: invoice.homeId,
            ...invoice.homeDetails,
          };

          this.logger.debug('Using stored homeDetails for temporary home:', {
            invoiceId,
            homeId: invoice.homeId._id,
            homeName: invoice.homeDetails.name,
          });
        } else {
          // If we don't have homeDetails, try to find the temporary home
          const tempHome: any = await this.temporaryHomeModel
            .findById(invoice.homeId)
            .lean();
          if (tempHome) {
            invoice.homeId = {
              _id: tempHome._id,
              name: `${tempHome.name} ${
                tempHome.isClaimed ? '(Migrated)' : '(Temporary)'
              }`,
              email: tempHome.email || '',
              phone: tempHome.phone || '',
              address: tempHome.address || {},
            };
            this.logger.debug('Found temporary home details:', {
              invoiceId,
              homeId: tempHome._id,
              homeName: tempHome.name,
            });
          } else {
            // Fallback for missing temporary home
            invoice.homeId = {
              _id: invoice.homeId,
              name: 'Unknown Temporary Home',
              email: '',
              phone: '',
              address: {},
            };
            this.logger.warn('Temporary home not found:', {
              invoiceId,
              homeId: invoice.homeId,
            });
          }
        }
      } else {
        // For regular homes, use standard population
        // This may already be populated, but ensure it is
        const invoiceWithHome = await this.invoiceModel
          .findById(invoiceId)
          .populate({
            path: 'homeId',
            select: 'name email phone address',
          });

        if (invoiceWithHome && invoiceWithHome.homeId) {
          invoice.homeId = invoiceWithHome.homeId;
        }
      }

      // Convert the MongoDB Map to a regular JavaScript object for easier handling
      const storedShiftSummary: Record<string, any> = {};
      if (
        invoice.shiftSummary &&
        typeof invoice.shiftSummary.forEach === 'function'
      ) {
        invoice.shiftSummary.forEach((value: any, key: string) => {
          storedShiftSummary[key] = value;
        });
      }

      // Then fetch the timesheets using the IDs
      const timesheets: any = await this.timesheetModel
        .find({
          _id: { $in: invoice.timesheetIds },
        })
        .populate({
          path: 'shift_',
          populate: {
            path: 'shiftPattern',
            model: 'ShiftPattern',
            select: 'name timings rates userTypeRates',
          },
        })
        .populate({
          path: 'carer',
          model: 'User',
          select: 'firstName lastName userType role',
        });

      // Process timesheets to get detailed view, using the stored summary data
      const processedTimesheets = this.processTimesheetsForInvoiceDetails(
        timesheets,
        invoice,
        storedShiftSummary
      );

      // Return final response
      return {
        ...invoice._doc,
        shiftSummary: storedShiftSummary,
        detailedTimesheets: processedTimesheets,
      };
    } catch (error: any) {
      this.logger.error('Error fetching invoice details:', {
        error: error.message,
        stack: error.stack,
        invoiceId,
      });
      throw error;
    }
  }

  async deleteInvoice(invoiceId: string): Promise<{ message: string }> {
    try {
      // Find invoice with minimal required populated fields
      const invoice: any = await this.invoiceModel
        .findById(invoiceId)
        .populate('agencyId', 'name')
        .populate('homeId', '_id')
        .lean();

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      // Define allowed statuses for deletion vs cancellation
      const deletableStatuses = [
        'cancelled',
        'pending',
        'rejected',
        'invalidated',
      ];
      const cancellableStatuses = ['paid', 'accepted', 'rejected'];

      if (deletableStatuses.includes(invoice.status)) {
        // Handle deletion
        await Promise.all([
          // Update associated timesheets
          this.updateTimesheetsStatus(
            invoice.timesheetIds,
            null,
            null,
            null,
            'draft'
          ),
          // Delete the invoice
          this.invoiceModel.findByIdAndDelete(invoiceId),
        ]);

        // Emit event for invoice deletion
        // this.eventBusService.emit('invoice.deleted', {
        //   invoiceId: invoice._id,
        //   agencyId: invoice.agencyId,
        //   homeId: invoice.homeId
        // });

        return { message: 'Invoice deleted successfully' };
      }

      if (cancellableStatuses.includes(invoice.status)) {
        // Handle cancellation
        await this.updateInvoiceStatus(invoiceId, 'cancelled');
        return { message: 'Invoice cancelled successfully' };
      }

      // If status doesn't match any condition
      throw new BadRequestException(
        'Invoice cannot be deleted in its current status'
      );
    } catch (error: any) {
      this.logger.error('Error deleting invoice:', {
        error: error.message,
        stack: error.stack,
        invoiceId,
      });
      throw error;
    }
  }

  async updateInvoiceStatus(
    invoiceId: string,
    newStatus: InvoiceStatus
  ): Promise<any> {
    try {
      const invoice: any = await this.invoiceModel.findById(invoiceId);
      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      // Validate status transition
      this.validateStatusTransition(invoice.status, newStatus);

      // Update invoice status
      invoice.status = newStatus;
      const savedInvoice = await invoice.save();

      // Process status-specific actions
      await this.processStatusChange(savedInvoice, newStatus);

      // Emit event for status update
      //   this.eventBusService.emit('invoice.statusChanged', {
      //     invoiceId: savedInvoice._id,
      //     agencyId: savedInvoice.agencyId,
      //     homeId: savedInvoice.homeId,
      //     oldStatus: invoice.status,
      //     newStatus
      //   });

      return savedInvoice;
    } catch (error: any) {
      this.logger.error('Error updating invoice status:', {
        error: error.message,
        stack: error.stack,
        invoiceId,
        newStatus,
      });
      throw error;
    }
  }

  async calculateInvoiceSummary(
    agencyId: string,
    homeId: string,
    startDate: string,
    endDate: string,
    holidays: string[] = []
  ): Promise<any> {
    try {
      this.logger.debug('Calculating invoice summary', {
        agencyId,
        homeId,
        startDate,
        endDate,
        holidays,
      });

      // First, check if this is a regular home or temporary home
      let isTemporaryHome = false;
      let homeDetails: any = null;
      let matchCondition: any = {};

      // Try to find in organizations first
      const regularHome: any = await this.organizationModel
        .findById(homeId)
        .lean();

      if (regularHome) {
        homeDetails = regularHome;
        // For regular homes, just match on the home field
        matchCondition = { home: new Types.ObjectId(homeId) };
        this.logger.debug('Regular home found:', {
          homeId,
          name: regularHome.name,
        });
      } else {
        // If not found in organizations, check temporary homes
        const tempHome: any = await this.temporaryHomeModel
          .findById(homeId)
          .lean();
        if (tempHome) {
          isTemporaryHome = true;
          homeDetails = tempHome;
          this.logger.debug('Temporary home found:', {
            homeId,
            name: tempHome.name,
            isTemporaryHome,
          });
          // For temporary homes, we need more complex matching
          matchCondition = {
            $or: [
              // Direct match on home field
              { home: new Types.ObjectId(homeId) },
              // If the shift is for this temporary home
              { 'shift.temporaryHomeId': homeId },
              // If the shift's homeId matches this temporary home
              { 'shift.homeId': new Types.ObjectId(homeId) },
            ],
          };
        } else {
          this.logger.warn('Home not found:', { homeId });
          throw new NotFoundException(`Home not found with ID: ${homeId}`);
        }
      }

      // Convert holidays to a Set for faster lookup
      const holidaySet = new Set(
        holidays.map((date) => moment(date).format('YYYY-MM-DD'))
      );

      // Get approved timesheets for the period with correct shift pattern lookup
      const timesheets = await this.timesheetModel.aggregate([
        // Join with shifts collection
        {
          $lookup: {
            from: 'shifts',
            localField: 'shift_',
            foreignField: '_id',
            as: 'shift',
          },
        },
        { $unwind: '$shift' },

        // Match date range and agency
        {
          $match: {
            'shift.date': {
              $gte: startDate,
              $lte: endDate,
            },
            agency: new Types.ObjectId(agencyId),
            status: 'approved',
            invoiceStatus: {
              $nin: ['pending_invoice', 'invoiced', 'paid'],
            },
          },
        },

        // Add the home matching condition
        {
          $match: matchCondition,
        },

        // Join with shiftTypes collection using shift.shiftPattern
        {
          $lookup: {
            from: 'shiftTypes',
            localField: 'shift.shiftPattern',
            foreignField: '_id',
            as: 'shiftPatternData',
          },
        },
        {
          $unwind: {
            path: '$shiftPatternData',
            preserveNullAndEmptyArrays: true,
          },
        },

        // Join with users collection for carer details
        {
          $lookup: {
            from: 'users',
            localField: 'carer',
            foreignField: '_id',
            as: 'carerDetails',
          },
        },
        { $unwind: '$carerDetails' },

        // Sort by date
        {
          $sort: { 'shift.date': 1 },
        },

        // Project only needed fields
        {
          $project: {
            _id: 1,
            shift: {
              _id: 1,
              date: 1,
              isEmergency: 1,
              homeId: 1,
              temporaryHomeId: 1,
              isTemporaryHome: 1,
            },
            carerDetails: {
              firstName: 1,
              lastName: 1,
              userType: 1,
              role: 1,
            },
            home: 1,
            shiftPatternData: 1,
            signature: 1,
          },
        },
      ]);

      this.logger.debug(`Found ${timesheets.length} approved timesheets`);

      // If no timesheets found, return empty result
      if (timesheets.length === 0) {
        return {
          timesheets: [],
          totalAmount: 0,
          totalTimesheets: 0,
          firstShift: null,
          lastShift: null,
          isTemporaryHome,
          homeDetails,
        };
      }

      // Process timesheets and build summary
      const { processedTimesheets, shiftSummary, totalAmount } =
        this.processTimesheetsForInvoiceCalculation(
          timesheets,
          homeId,
          isTemporaryHome,
          homeDetails,
          holidaySet
        );

      // Handle empty results
      if (processedTimesheets.length === 0) {
        return {
          timesheets: [],
          totalAmount: 0,
          totalTimesheets: 0,
          firstShift: null,
          lastShift: null,
          isTemporaryHome,
          homeDetails,
        };
      }

      return {
        timesheets: processedTimesheets,
        totalAmount,
        totalTimesheets: processedTimesheets.length,
        firstShift: {
          date: processedTimesheets[0].shiftDate,
          type: processedTimesheets[0].shiftType,
        },
        lastShift: {
          date: processedTimesheets[processedTimesheets.length - 1].shiftDate,
          type: processedTimesheets[processedTimesheets.length - 1].shiftType,
        },
        shiftSummary,
        isTemporaryHome,
        homeDetails,
      };
    } catch (error: any) {
      this.logger.error('Error calculating invoice summary:', {
        error: error.message,
        stack: error.stack,
        agencyId,
        homeId,
        startDate,
        endDate,
      });
      throw error;
    }
  }

  async initiateInvoicePdfGeneration(payload: {
    invoiceId: string;
    includeDetailed: boolean;
    requestedBy: string;
    timestamp: string;
  }): Promise<void> {
    try {
      // Emit event for PDF generation
      //   await this.eventBusService.emit('invoice.pdfGenerationRequested', payload);
    } catch (error: any) {
      this.logger.error('Error initiating PDF generation:', {
        error: error.message,
        stack: error.stack,
        payload,
      });
      throw error;
    }
  }

  // Private helper methods
  private async checkExistingInvoice(
    timesheetIds: string[],
    startDate: string,
    endDate: string
  ): Promise<void> {
    const existingInvoice = await this.invoiceModel.findOne({
      timesheetIds: { $in: timesheetIds },
    });

    if (existingInvoice) {
      throw new BadRequestException(
        'An invoice already exists for these timesheets or date range.'
      );
    }
  }

  private formatShiftSummary(
    shiftSummary: Record<string, any>
  ): Record<string, ShiftSummaryItem> {
    return Object.entries(shiftSummary).reduce(
      (acc, [key, data]: [string, any]) => {
        acc[key] = {
          count: data.count,
          weekdayHours: data.weekdayHours || 0,
          weekendHours: data.weekendHours || 0,
          holidayHours: data.holidayHours || 0,
          emergencyHours: data.emergencyHours || 0,
          weekdayRate: data.weekdayRate || 0,
          weekendRate: data.weekendRate || 0,
          holidayRate: data.holidayRate || 0,
          emergencyRate: data.emergencyRate || 0,
          totalHours: data.totalHours || 0,
          totalAmount: data.totalAmount || 0,
        };
        return acc;
      },
      {} as Record<string, ShiftSummaryItem>
    );
  }

  private convertShiftSummaryToMap(
    shiftSummary: Record<string, ShiftSummaryItem>
  ): Map<string, any> {
    const shiftSummaryMap = new Map<string, any>();

    for (const [key, value] of Object.entries(shiftSummary)) {
      shiftSummaryMap.set(key, value);
    }

    return shiftSummaryMap;
  }

  private generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  }

  private validateStatusTransition(
    currentStatus: string,
    newStatus: InvoiceStatus
  ): void {
    const validNextStatuses =
      this.STATUS_TRANSITIONS[currentStatus as InvoiceStatus]?.nextStatuses ||
      [];
    if (!validNextStatuses.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  private async processStatusChange(
    invoice: any,
    status: InvoiceStatus
  ): Promise<void> {
    const statusConfig = this.STATUS_TRANSITIONS[status];

    const tasks: Promise<any>[] = [];

    // Update timesheet statuses if needed
    if (statusConfig.timesheetStatus && invoice.timesheetIds?.length > 0) {
      tasks.push(
        this.updateTimesheetsStatus(
          invoice.timesheetIds,
          statusConfig.timesheetStatus,
          invoice._id.toString(),
          invoice.invoiceNumber
        ).catch((error) => {
          this.logger.error('Error updating timesheet statuses:', error);
          throw error;
        })
      );
    }

    // Send notification event if configured
    if (statusConfig.notificationType && statusConfig.notificationTitle) {
      const notificationPayload = {
        type: statusConfig.notificationType,
        title: statusConfig.notificationTitle,
        message: `Invoice ${invoice.invoiceNumber} has been ${status}`,
        entityId: invoice._id.toString(),
        entityType: 'INVOICE',
      };

      // Determine notification recipient based on status
      const notificationRecipientId = ['accepted', 'rejected'].includes(status)
        ? invoice.agencyId.toString()
        : invoice.homeId.toString();

      //   tasks.push(
      //     this.eventBusService.emit('notification.send', {
      //       recipientId: notificationRecipientId,
      //       payload: notificationPayload
      //     }).catch((error) => {
      //       this.logger.error('Error sending notification:', error);
      //       throw error;
      //     })
      //   );
    }

    if (tasks.length > 0) {
      await Promise.all(tasks);
    }
  }

  private async updateTimesheetsStatus(
    timesheetIds: string[],
    status: TimesheetStatus | null,
    invoiceId: string | null,
    invoiceNumber: string | null,
    invoiceStatus?: InvoiceStatus
  ): Promise<void> {
    try {
      const updateObj: any = {};

      if (status !== null) {
        updateObj.status = status;
      }

      if (invoiceStatus) {
        updateObj.invoiceStatus = invoiceStatus;
      }

      if (invoiceNumber !== null) {
        updateObj.invoiceNumber = invoiceNumber;
      }

      if (invoiceId !== null) {
        updateObj.invoiceId = invoiceId;
      } else {
        // If we're clearing the invoice, remove these fields
        updateObj.invoiceId = null;
        updateObj.invoiceNumber = null;
      }

      await this.timesheetModel.updateMany(
        { _id: { $in: timesheetIds } },
        { $set: updateObj }
      );
    } catch (error) {
      this.logger.error('Error updating timesheet statuses:', error);
      throw error;
    }
  }

  private prepareInvoiceNotificationPayload(invoiceId: string): any {
    return {
      type: 'INVOICE_GENERATED',
      title: 'New Invoice Created',
      message: 'A new invoice has been created for the care home',
      entityId: invoiceId,
      entityType: 'INVOICE',
    };
  }

  private calculateTotalHours(startTime: string, endTime: string): number {
    if (!startTime || !endTime) return 0;

    const start = moment(startTime, 'HH:mm');
    const end = moment(endTime, 'HH:mm');

    if (end.isBefore(start)) {
      return moment.duration(end.add(1, 'day').diff(start)).asHours();
    } else {
      return moment.duration(end.diff(start)).asHours();
    }
  }

  private processTimesheetsForInvoiceDetails(
    timesheets: any[],
    invoice: any,
    storedShiftSummary: Record<string, any>
  ): any[] {
    return timesheets.map((timesheet) => {
      const homeId = invoice.homeId._id.toString();

      // Normalize the carer role to handle different formats (e.g., senior_carer vs Senior Carer)
      const carerRoleRaw =
        timesheet.carer?.role || timesheet.carer?.userType || '';
      let carerRole = carerRoleRaw.toLowerCase();
      if (carerRole === 'senior_carer') {
        carerRole = 'senior carer';
      }

      // Find timing with fallback mechanisms
      let timing = timesheet.shift_?.shiftPattern?.timings?.find(
        (t: any) => t.careHomeId === homeId
      );

      // If not found and this is a temporary home, try alternatives
      if (!timing && invoice.isTemporaryHome && timesheet.shift_) {
        // Try with the shift's homeId
        if (timesheet.shift_.homeId) {
          timing = timesheet.shift_?.shiftPattern?.timings?.find(
            (t: any) => t.careHomeId === timesheet.shift_.homeId.toString()
          );
        }

        // If still not found, try with temporaryHomeId
        if (!timing && timesheet.shift_.temporaryHomeId) {
          timing = timesheet.shift_?.shiftPattern?.timings?.find(
            (t: any) => t.careHomeId === timesheet.shift_.temporaryHomeId
          );
        }
      }

      // Find rate with improved approach - match both careHomeId AND userType
      let rate = timesheet.shift_?.shiftPattern?.rates?.find((r: any) => {
        const rateUserType = (r.userType || '').toLowerCase();
        return r.careHomeId === homeId && rateUserType === carerRole;
      });

      // If not found and this is a temporary home, try alternatives
      if (!rate && invoice.isTemporaryHome && timesheet.shift_) {
        // Try with the shift's homeId
        if (timesheet.shift_.homeId) {
          rate = timesheet.shift_?.shiftPattern?.rates?.find((r: any) => {
            const rateUserType = (r.userType || '').toLowerCase();
            return (
              r.careHomeId === timesheet.shift_.homeId.toString() &&
              rateUserType === carerRole
            );
          });
        }

        // If still not found, try with temporaryHomeId
        if (!rate && timesheet.shift_.temporaryHomeId) {
          rate = timesheet.shift_?.shiftPattern?.rates?.find((r: any) => {
            const rateUserType = (r.userType || '').toLowerCase();
            return (
              r.careHomeId === timesheet.shift_.temporaryHomeId &&
              rateUserType === carerRole
            );
          });
        }
      }

      // If still no rate, try by user type
      if (!rate && carerRole) {
        const userTypeRate =
          timesheet.shift_?.shiftPattern?.userTypeRates?.find((r: any) => {
            const rateUserType = (r.userType || '').toLowerCase();
            return rateUserType === carerRole;
          });

        if (userTypeRate) {
          rate = userTypeRate;
        }
      }

      // Get the shift type
      const shiftType = timesheet.shift_?.shiftPattern?.name;

      // Find relevant shift summary data - with null check
      const summaryData = storedShiftSummary[shiftType] || null;

      // Determine if this is considered a holiday based on stored data - with null check
      const hasHolidayHours = summaryData && summaryData.holidayHours > 0;
      const isHoliday =
        hasHolidayHours &&
        summaryData &&
        summaryData.weekdayHours +
          summaryData.weekendHours +
          summaryData.emergencyHours;

      // Get stored rates from summary if available - with null checks
      const holidayRate = summaryData ? summaryData.holidayRate : 0;
      const weekdayRate = summaryData ? summaryData.weekdayRate : 0;
      const weekendRate = summaryData ? summaryData.weekendRate : 0;
      const emergencyRate = summaryData ? summaryData.emergencyRate : 0;

      // Determine if weekend
      const isWeekend = moment(timesheet.shift_?.date).isoWeekday() > 5;
      const isEmergency = timesheet.shift_?.isEmergency || false;

      // Prioritize role-specific rate calculation over summary data
      let hourlyRate;

      // First try to calculate from the role-specific rate if available
      if (rate) {
        // Handle holiday rate if applicable
        if (isHoliday && 'holidayRate' in rate) {
          hourlyRate =
            isEmergency && 'emergencyHolidayRate' in rate
              ? rate.emergencyHolidayRate
              : rate.holidayRate;
        } else {
          // Otherwise use normal rate logic
          hourlyRate = isEmergency
            ? isWeekend
              ? rate.emergencyWeekendRate
              : rate.emergencyWeekdayRate
            : isWeekend
            ? rate.weekendRate
            : rate.weekdayRate;
        }
      }
      // Only fall back to summary data if no role-specific rate was found
      else if (!hourlyRate) {
        if (isHoliday && holidayRate) {
          hourlyRate =
            isEmergency && emergencyRate ? emergencyRate : holidayRate;
        } else if (isEmergency && emergencyRate) {
          hourlyRate = emergencyRate;
        } else if (isWeekend && weekendRate) {
          hourlyRate = weekendRate;
        } else {
          hourlyRate = weekdayRate;
        }
      }

      // Calculate hours based on timing data
      let hours = 0;
      if (timing) {
        // If billable hours is defined, use that value directly
        if (
          timing.billableHours !== undefined &&
          timing.billableHours !== null
        ) {
          hours = timing.billableHours;
          this.logger.debug('Using predefined billable hours:', {
            timesheetId: timesheet._id,
            billableHours: hours,
          });
        } else {
          // Otherwise, calculate from start and end times, considering break hours
          const startTime = moment(timing.startTime, 'HH:mm');
          const endTime = moment(timing.endTime, 'HH:mm');

          let totalHours;
          if (endTime.isBefore(startTime)) {
            totalHours = moment
              .duration(endTime.add(1, 'day').diff(startTime))
              .asHours();
          } else {
            totalHours = moment.duration(endTime.diff(startTime)).asHours();
          }

          // Subtract break hours if defined
          const breakHours = timing.breakHours || 0;
          hours = Math.max(0, totalHours - breakHours);

          this.logger.debug('Calculated billable hours:', {
            timesheetId: timesheet._id,
            totalHours,
            breakHours,
            billableHours: hours,
          });
        }
      }

      // Get amount from hourly rate and hours
      const amount = (hourlyRate || 0) * hours;

      return {
        _id: timesheet._id,
        shiftDate: timesheet.shift_?.date,
        shiftType: shiftType,
        carerName: `${timesheet.carer?.firstName || ''} ${
          timesheet.carer?.lastName || ''
        }`.trim(),
        carerRole: carerRoleRaw, // Include role for debugging
        hourlyRate: hourlyRate || 0,
        hours,
        amount,
        isEmergency: isEmergency,
        isHoliday: isHoliday,
        isWeekend: isWeekend, // Added isWeekend flag for the frontend
        // Include the following for debugging or reference
        totalHoursScheduled: timing
          ? this.calculateTotalHours(timing.startTime, timing.endTime)
          : 0,
        breakHours: timing?.breakHours || 0,
        billableHours: timing?.billableHours,
      };
    });
  }

  private processTimesheetsForInvoiceCalculation(
    timesheets: any[],
    homeId: string,
    isTemporaryHome: boolean,
    homeDetails: any,
    holidaySet: Set<string>
  ): {
    processedTimesheets: InvoiceTimesheet[];
    shiftSummary: Record<string, any>;
    totalAmount: number;
  } {
    let totalAmount = 0;
    const processedTimesheets: InvoiceTimesheet[] = [];
    const shiftSummary: Record<string, any> = {};

    for (const timesheet of timesheets) {
      try {
        if (!timesheet.shiftPatternData) {
          this.logger.warn('No shift pattern found for timesheet:', {
            timesheetId: timesheet._id,
            shiftId: timesheet.shift._id,
          });
          continue;
        }

        // Normalize the carer role to handle different formats (e.g., senior_carer vs Senior Carer)
        const carerRoleRaw =
          timesheet.carerDetails.role || timesheet.carerDetails.userType || '';
        let carerRole = carerRoleRaw.toLowerCase();
        if (carerRole === 'senior_carer') {
          carerRole = 'senior carer';
        }

        // Find rate - with multiple fallback options for temporary homes, but now also considering userType
        let rate: any = null;

        if (isTemporaryHome) {
          // Try all possible combinations for temporary homes
          const possibleIds = [
            homeId,
            homeId.toString(),
            timesheet.shift.homeId?.toString(),
            timesheet.shift.temporaryHomeId,
          ].filter(Boolean);

          // Try each ID until we find a match for this specific user type
          for (const id of possibleIds) {
            rate = timesheet.shiftPatternData.rates?.find((r: any) => {
              const rateUserType = (r.userType || '').toLowerCase();
              return r.careHomeId === id && rateUserType === carerRole;
            });
            if (rate) break;
          }
        } else {
          // For regular homes - match both homeId AND user role
          rate = timesheet.shiftPatternData.rates?.find((r: any) => {
            const rateUserType = (r.userType || '').toLowerCase();
            return (
              r.careHomeId === homeId.toString() && rateUserType === carerRole
            );
          });
        }

        // If no home-specific rate found, try user type rate as fallback
        if (!rate && timesheet.shiftPatternData.userTypeRates?.length) {
          const userTypeRate = timesheet.shiftPatternData.userTypeRates.find(
            (r: any) => {
              const rateUserType = (r.userType || '').toLowerCase();
              return rateUserType === carerRole;
            }
          );

          if (userTypeRate) {
            rate = userTypeRate;
          }
        }

        if (!rate) {
          this.logger.warn('No rate found for timesheet:', {
            timesheetId: timesheet._id,
            homeId,
            userType: carerRoleRaw,
            normalizedUserType: carerRole,
          });
          continue;
        }

        // Find timing - with similar fallback approach
        let timing: any = null;

        if (isTemporaryHome) {
          // Try all possible combinations for temporary homes
          const possibleIds = [
            homeId,
            homeId.toString(),
            timesheet.shift.homeId?.toString(),
            timesheet.shift.temporaryHomeId,
          ].filter(Boolean);

          // Try each ID until we find a match
          for (const id of possibleIds) {
            timing = timesheet.shiftPatternData.timings?.find(
              (t: any) => t.careHomeId === id
            );
            if (timing) break;
          }
        } else {
          // For regular homes
          timing = timesheet.shiftPatternData.timings?.find(
            (t: any) => t.careHomeId === homeId.toString()
          );
        }

        if (!timing) {
          this.logger.warn('No timing found for timesheet:', {
            timesheetId: timesheet._id,
            homeId,
          });
          continue;
        }

        // Check if the shift date is in the holidays list (using normalized format)
        const normalizedShiftDate = moment(timesheet.shift.date).format(
          'YYYY-MM-DD'
        );
        const isHoliday = holidaySet.has(normalizedShiftDate);

        // Determine if weekend
        const isWeekend = moment(timesheet.shift.date).isoWeekday() > 5;
        const isEmergency = timesheet.shift.isEmergency || false;

        // Calculate hourly rate - prioritize holiday rate if applicable
        let hourlyPay;
        let rateType = 'standard';

        if (isHoliday && 'holidayRate' in rate) {
          // Use holiday rate if it's a holiday and the rate exists
          if (isEmergency && 'emergencyHolidayRate' in rate) {
            hourlyPay = rate.emergencyHolidayRate; // Emergency holiday rate
            rateType = 'emergencyHoliday';
          } else {
            hourlyPay = rate.holidayRate; // Regular holiday rate
            rateType = 'holiday';
          }
        } else {
          // Otherwise use the normal logic
          if (isEmergency) {
            if (isWeekend) {
              hourlyPay = rate.emergencyWeekendRate;
              rateType = 'emergencyWeekend';
            } else {
              hourlyPay = rate.emergencyWeekdayRate;
              rateType = 'emergencyWeekday';
            }
          } else {
            if (isWeekend) {
              hourlyPay = rate.weekendRate;
              rateType = 'weekend';
            } else {
              hourlyPay = rate.weekdayRate;
              rateType = 'weekday';
            }
          }
        }

        // Calculate billable hours
        let hours = 0;
        let totalHours = 0;
        let breakHours = timing.breakHours || 0;

        // If billable hours is explicitly defined, use it directly
        if (
          timing.billableHours !== undefined &&
          timing.billableHours !== null
        ) {
          hours = timing.billableHours;
          this.logger.debug('Using predefined billable hours:', {
            timesheetId: timesheet._id,
            billableHours: hours,
          });
        } else {
          // Otherwise calculate from shift times and break hours
          const startTime = moment(timing.startTime, 'HH:mm');
          const endTime = moment(timing.endTime, 'HH:mm');

          if (endTime.isBefore(startTime)) {
            // Overnight shift
            totalHours = moment
              .duration(endTime.add(1, 'day').diff(startTime))
              .asHours();
          } else {
            totalHours = moment.duration(endTime.diff(startTime)).asHours();
          }

          // Subtract break hours to get billable hours
          hours = Math.max(0, totalHours - breakHours);

          this.logger.debug('Calculated billable hours:', {
            timesheetId: timesheet._id,
            totalHours,
            breakHours,
            billableHours: hours,
          });
        }

        const amount = hourlyPay * hours;
        totalAmount += amount;

        // Update shift summary
        const shiftType = timesheet.shiftPatternData.name;
        if (!shiftSummary[shiftType]) {
          shiftSummary[shiftType] = {
            count: 0,
            totalHours: 0,
            billableHours: 0,
            breakHours: 0,
            weekdayHours: 0,
            weekendHours: 0,
            holidayHours: 0,
            emergencyHours: 0,
            weekdayRate: rate.weekdayRate || 0,
            weekendRate: rate.weekendRate || 0,
            holidayRate: rate.holidayRate || 0,
            emergencyRate: rate.emergencyWeekdayRate || rate.emergencyRate || 0,
            totalAmount: 0,
          };
        }

        // Update summary counters
        shiftSummary[shiftType].count += 1;
        shiftSummary[shiftType].totalHours += totalHours || hours;
        shiftSummary[shiftType].billableHours += hours;
        shiftSummary[shiftType].breakHours += breakHours;
        shiftSummary[shiftType].totalAmount += amount;

        // Update hours by category
        if (isHoliday) {
          shiftSummary[shiftType].holidayHours += hours;
        } else if (isEmergency) {
          shiftSummary[shiftType].emergencyHours += hours;
        } else if (isWeekend) {
          shiftSummary[shiftType].weekendHours += hours;
        } else {
          shiftSummary[shiftType].weekdayHours += hours;
        }

        // Extract signature information
        const signatureInfo = timesheet.signature
          ? {
              downloadUrl: timesheet.signature.downloadUrl,
              signerName: timesheet.signature.signerName,
              signerRole: timesheet.signature.signerRole,
              timestamp: timesheet.signature.timestamp,
            }
          : null;

        processedTimesheets.push({
          _id: timesheet._id,
          hourlyRate: hourlyPay,
          hours, // Billable hours
          totalHours: totalHours || hours, // Total shift hours (if available)
          breakHours: breakHours, // Break hours
          amount,
          shiftDate: timesheet.shift.date,
          shiftType,
          carerName: `${timesheet.carerDetails.firstName} ${timesheet.carerDetails.lastName}`,
          homeName: homeDetails.name,
          isEmergency,
          isHoliday,
          isWeekend,
          signature: signatureInfo,
          // Add timing details for reference
          timing: {
            startTime: timing.startTime,
            endTime: timing.endTime,
            billableHours: timing.billableHours,
            breakHours: timing.breakHours,
          },
        });
      } catch (error: any) {
        this.logger.error(
          'Error processing timesheet for invoice calculation:',
          {
            error: error.message,
            timesheetId: timesheet._id,
          }
        );
      }
    }

    return { processedTimesheets, shiftSummary, totalAmount };
  }
}
