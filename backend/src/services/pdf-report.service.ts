import axios from 'axios';
import { ReportService } from './report.service';
import { ReportRepository } from '../repositories/report.repository';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

// pdfmake PdfPrinter class - import from the Printer module
const PdfPrinter = require('pdfmake/js/Printer').default;

// Define fonts for pdfmake (using standard fonts)
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

// Create PdfPrinter instance with fonts
const printer = new PdfPrinter(fonts);

export class PdfReportService {
  private reportService = new ReportService();
  private reportRepo = new ReportRepository();

  /**
   * Generate a chart image using QuickChart.io showing Revenue vs Cost for last 7 days
   */
  private async generateChartImage(dailyMetrics: Array<{ date: string; revenue: number; cost: number }>): Promise<Buffer> {
    // Prepare data for chart
    const labels = dailyMetrics.map(m => {
      const date = new Date(m.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const revenueData = dailyMetrics.map(m => m.revenue);
    const costData = dailyMetrics.map(m => m.cost);

    const chartConfig = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Revenue (SSP)',
            data: revenueData,
            backgroundColor: '#4CAF50',
          },
          {
            label: 'Cost (SSP)',
            data: costData,
            backgroundColor: '#F44336',
          },
        ],
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Revenue vs Cost - Last 7 Days',
          },
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value: any) {
                return value.toLocaleString('en-US');
              },
            },
          },
        },
      },
    };

    try {
      const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
      const response = await axios.get(chartUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error generating chart:', error);
      // Return empty buffer if chart generation fails
      return Buffer.alloc(0);
    }
  }

  /**
   * Format currency for display
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Format date for display
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Generate Daily Executive Briefing PDF
   */
  async generateDailyBriefing(): Promise<Buffer> {
    // Fetch dashboard data for today
    const today = new Date();
    const dashboardData = await this.reportService.getDashboardData(today, today);

    // Fetch daily metrics for last 7 days for the chart
    const dailyMetrics = await this.reportService.getDailyReport(undefined, 7);
    
    // Prepare chart data: get revenue and cost for each day
    const chartData = dailyMetrics.map(metric => {
      const cost = (metric.fuel_cost || 0) + (metric.other_expenses || 0);
      return {
        date: metric.metric_date,
        revenue: metric.total_revenue || 0,
        cost: cost,
      };
    }).reverse(); // Reverse to show oldest to newest

    // Generate chart image
    const chartImage = await this.generateChartImage(chartData);

    // Fetch top 3 customers by revenue for today
    const topCustomers = await this.reportRepo.getTopCustomersByRevenue(today, 3);

    // Prepare PDF document definition
    const docDefinition: TDocumentDefinitions = {
      content: [
        // Header
        {
          text: 'HGT Ice Factory - Executive Daily Briefing',
          style: 'header',
          alignment: 'center' as const,
          margin: [0, 0, 0, 20] as [number, number, number, number],
        },
        // Date
        {
          text: `Report Date: ${this.formatDate(dashboardData.period.end_date)}`,
          style: 'subheader',
          alignment: 'center' as const,
          margin: [0, 0, 0, 30] as [number, number, number, number],
        },
        // Summary Table
        {
          text: 'Key Metrics',
          style: 'sectionHeader',
          margin: [0, 0, 0, 10] as [number, number, number, number],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', '*'],
            body: [
              ['Metric', 'Amount (SSP)', 'Status'],
              [
                'Net Profit',
                this.formatCurrency(dashboardData.net_profit),
                {
                  text: dashboardData.net_profit >= 0 ? 'Positive' : 'Negative',
                  color: dashboardData.net_profit >= 0 ? '#4CAF50' : '#F44336',
                },
              ],
              [
                'Total Sales',
                this.formatCurrency(dashboardData.total_revenue),
                '-',
              ],
              [
                'Burn Rate',
                this.formatCurrency(dashboardData.total_burn),
                '-',
              ],
            ],
          },
          margin: [0, 0, 0, 30] as [number, number, number, number],
        },
        // Chart
        ...(chartImage.length > 0
          ? [
              {
                text: 'Revenue vs Cost - Last 7 Days',
                style: 'sectionHeader',
                margin: [0, 0, 0, 10] as [number, number, number, number],
              },
              {
                image: `data:image/png;base64,${chartImage.toString('base64')}`,
                width: 500,
                alignment: 'center' as const,
                margin: [0, 0, 0, 30] as [number, number, number, number],
              },
            ]
          : []),
        // Top Customers
        {
          text: 'Top Customers by Revenue Today',
          style: 'sectionHeader',
          margin: [0, 0, 0, 10] as [number, number, number, number],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*'],
            body: [
              ['Customer Name', 'Revenue (SSP)'],
              ...(topCustomers.length > 0
                ? topCustomers.map((customer) => [
                    customer.customer_name,
                    this.formatCurrency(customer.total_revenue),
                  ])
                : [['No sales today', '-']]),
            ],
          },
          margin: [0, 0, 0, 30] as [number, number, number, number],
        },
        // Footer
        {
          text: 'Generated automatically by HGT OS',
          style: 'footer',
          alignment: 'center' as const,
          margin: [0, 30, 0, 0] as [number, number, number, number],
        },
      ],
      styles: {
        header: {
          fontSize: 24,
          bold: true,
          color: '#1a1a1a',
        },
        subheader: {
          fontSize: 14,
          color: '#666666',
        },
        sectionHeader: {
          fontSize: 16,
          bold: true,
          color: '#1a1a1a',
          margin: [0, 10, 0, 5] as [number, number, number, number],
        },
        footer: {
          fontSize: 10,
          color: '#999999',
          italics: true,
        },
      },
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
      },
    };

    // Generate PDF
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    // Convert to buffer
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];

      pdfDoc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      pdfDoc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      pdfDoc.on('error', (error: Error) => {
        reject(error);
      });

      pdfDoc.end();
    });
  }
}
