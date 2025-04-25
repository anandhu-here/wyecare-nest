import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  HttpStatus,
  Res,
  Query,
  Delete,
  Patch,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../authentication/jwt/jwt-auth.guard';
import { RequirePermission } from '../../authorization/permissions.decorator';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from '../dto/update-invoice-status.dto';
import { GenerateInvoicePdfDto } from '../dto/generate-invoice-pdf.dto';
import { InvoiceFilterDto } from '../dto/invoice-filter.dto';
import { CalculateInvoiceDto } from '../dto/calculate-invoice.dto';
import { OrganizationContextGuard } from '../../organizations/organization-context.guard';
import { InvoiceService } from '../services/invoice.service';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  private readonly logger = new Logger(InvoiceController.name);

  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @UseGuards(OrganizationContextGuard)
  @RequirePermission('edit_invoices')
  async createInvoice(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const agencyId = req.currentOrganization._id.toString();

      const invoice = await this.invoiceService.createInvoice({
        ...createInvoiceDto,
        agencyId,
      });

      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Invoice created successfully',
        data: invoice,
      });
    } catch (error) {
      this.logger.error(
        `Error creating invoice: ${error.message}`,
        error.stack
      );

      if (error instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to create invoice',
      });
    }
  }

  @Get()
  @UseGuards(OrganizationContextGuard)
  @RequirePermission('view_invoices')
  async getInvoices(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Req() req: any,
    @Res() res: Response,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    try {
      const orgId = req.currentOrganization._id.toString();
      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);

      const filter: InvoiceFilterDto = {
        status,
        search,
        startDate,
        endDate,
      };

      const result = await this.invoiceService.getInvoices(
        orgId,
        pageNumber,
        limitNumber,
        filter
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Invoices retrieved successfully',
        data: result.invoices,
        pagination: {
          total: result.total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(result.total / limitNumber),
        },
      });
    } catch (error) {
      this.logger.error(
        `Error retrieving invoices: ${error.message}`,
        error.stack
      );
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to retrieve invoices',
      });
    }
  }

  @Get('calculate')
  @UseGuards(OrganizationContextGuard)
  @RequirePermission('view_invoices')
  async calculateInvoice(
    @Query() calculateInvoiceDto: CalculateInvoiceDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const agencyId = req.currentOrganization._id.toString();

      if (
        !calculateInvoiceDto.homeId ||
        !calculateInvoiceDto.startDate ||
        !calculateInvoiceDto.endDate
      ) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Missing required parameters: homeId, startDate, or endDate',
        });
      }

      const calculationResult =
        await this.invoiceService.calculateInvoiceSummary(
          agencyId,
          calculateInvoiceDto.homeId,
          calculateInvoiceDto.startDate,
          calculateInvoiceDto.endDate,
          calculateInvoiceDto.holidays || []
        );

      return res.status(HttpStatus.OK).json({
        success: true,
        data: calculationResult,
      });
    } catch (error) {
      this.logger.error(
        `Error calculating invoice: ${error.message}`,
        error.stack
      );

      if (error instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to calculate invoice',
      });
    }
  }

  @Get(':invoiceId')
  @RequirePermission('view_invoices')
  async getInvoiceById(
    @Param('invoiceId') invoiceId: string,
    @Res() res: Response
  ) {
    try {
      const invoice = await this.invoiceService.getInvoiceById(invoiceId);

      if (!invoice) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'Invoice not found',
        });
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Invoice retrieved successfully',
        data: invoice,
      });
    } catch (error) {
      this.logger.error(
        `Error retrieving invoice by ID: ${error.message}`,
        error.stack
      );
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to retrieve invoice',
      });
    }
  }

  @Delete(':invoiceId')
  @RequirePermission('edit_invoices')
  async deleteInvoice(
    @Param('invoiceId') invoiceId: string,
    @Res() res: Response
  ) {
    try {
      const deleteResult = await this.invoiceService.deleteInvoice(invoiceId);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: deleteResult.message || 'Invoice deleted successfully',
      });
    } catch (error) {
      this.logger.error(
        `Error deleting invoice: ${error.message}`,
        error.stack
      );

      if (error instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to delete invoice',
      });
    }
  }

  @Patch(':invoiceId/status')
  @RequirePermission('edit_invoices')
  async updateInvoiceStatus(
    @Param('invoiceId') invoiceId: string,
    @Body() updateStatusDto: UpdateInvoiceStatusDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      // Check if current user is from a home organization and trying to perform allowed actions
      if (req.user?.role === 'home' && updateStatusDto.status !== 'accepted') {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'You can only accept an invoice',
        });
      }

      const updatedInvoice = await this.invoiceService.updateInvoiceStatus(
        invoiceId,
        updateStatusDto.status as any
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Invoice status updated successfully',
        data: updatedInvoice,
      });
    } catch (error) {
      this.logger.error(
        `Error updating invoice status: ${error.message}`,
        error.stack
      );

      if (error instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
      }

      if (error instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to update invoice status',
      });
    }
  }

  @Post(':invoiceId/pdf')
  @RequirePermission('view_invoices')
  async generateInvoicePdf(
    @Param('invoiceId') invoiceId: string,
    @Body() generatePdfDto: GenerateInvoicePdfDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      // Check if invoice exists
      const invoice = await this.invoiceService.getInvoiceById(invoiceId);

      if (!invoice) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'Invoice not found',
        });
      }

      // Create payload for PDF generation
      const payload = {
        invoiceId,
        includeDetailed: generatePdfDto.includeDetailed || false,
        requestedBy: req.user._id,
        timestamp: new Date().toISOString(),
      };

      // Initiate asynchronous PDF generation
      await this.invoiceService.initiateInvoicePdfGeneration(payload);

      return res.status(HttpStatus.ACCEPTED).json({
        success: true,
        message:
          'PDF generation has been initiated. You will be notified when it is ready.',
        data: {
          invoiceId,
          status: 'processing',
        },
      });
    } catch (error) {
      this.logger.error(
        `Error initiating PDF generation: ${error.message}`,
        error.stack
      );

      if (error instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to generate invoice PDF',
      });
    }
  }
}
