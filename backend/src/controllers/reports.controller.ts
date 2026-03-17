import { Request, Response } from 'express';
import { ReportService, DashboardMetricsWithComparison } from '../services/report.service';
import { CustomerService } from '../services/customer.service';
import { PdfReportService } from '../services/pdf-report.service';
import { ApiResponse } from '../types';

export class ReportsController {
  private reportService = new ReportService();
  private customerService = new CustomerService();
  private pdfReportService = new PdfReportService();

  async getDailyReport(req: Request, res: Response): Promise<void> {
    try {
      const date = req.query.date as string | undefined;
      const days = parseInt(req.query.days as string) || 7;

      const metrics = await this.reportService.getDailyReport(date, days);

      const response: ApiResponse<typeof metrics> = {
        success: true,
        data: metrics,
      };

      res.status(200).json(response);
    } catch (error: any) {
      throw error;
    }
  }

  async getMonthlyReport(req: Request, res: Response): Promise<void> {
    try {
      const month = req.query.month as string | undefined;
      const year = req.query.year as string | undefined;

      const metrics = await this.reportService.getMonthlyReport(year, month);

      const response: ApiResponse<typeof metrics> = {
        success: true,
        data: metrics,
      };

      res.status(200).json(response);
    } catch (error: any) {
      throw error;
    }
  }

  async getDashboardSummary(req: Request, res: Response): Promise<void> {
    try {
      // Parse optional date range from query parameters
      const startDateStr = req.query.start_date as string | undefined;
      const endDateStr = req.query.end_date as string | undefined;

      const startDate = startDateStr ? new Date(startDateStr) : undefined;
      const endDate = endDateStr ? new Date(endDateStr) : undefined;

      // Use new dashboard data method - returns extended metrics with comparison
      const metrics = await this.reportService.getDashboardData(startDate, endDate);

      const response: ApiResponse<DashboardMetricsWithComparison> = {
        success: true,
        data: metrics,
      };

      res.status(200).json(response);
    } catch (error: any) {
      throw error;
    }
  }

  async getCustomerReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const startDate = req.query.start_date as string | undefined;
      const endDate = req.query.end_date as string | undefined;

      const ledger = await this.customerService.getCustomerLedger(id, startDate, endDate);

      const response: ApiResponse<typeof ledger> = {
        success: true,
        data: ledger,
      };

      res.status(200).json(response);
    } catch (error: any) {
      throw error;
    }
  }

  async exportDailyPdf(_req: Request, res: Response): Promise<void> {
    try {
      const pdfBuffer = await this.pdfReportService.generateDailyBriefing();

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="daily-briefing.pdf"');
      res.setHeader('Content-Length', pdfBuffer.length.toString());

      // Stream the PDF to response
      res.status(200).send(pdfBuffer);
    } catch (error: any) {
      throw error;
    }
  }
}

