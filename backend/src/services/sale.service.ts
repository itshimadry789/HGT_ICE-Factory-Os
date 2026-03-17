import { SaleRepository } from '../repositories/sale.repository';
import { CustomerRepository } from '../repositories/customer.repository';
import { Sale } from '../types';
import { AppError } from '../middlewares/error.middleware';
import { webhookService } from './webhook.service';

export class SaleService {
  private saleRepo = new SaleRepository();
  private customerRepo = new CustomerRepository();

  async createSale(saleData: Partial<Sale>, userId?: string): Promise<Sale> {
    const customer = await this.customerRepo.findById(saleData.customer_id || '');

    if (!customer) {
      throw new AppError('Customer not found', 'CUSTOMER_NOT_FOUND', 404);
    }

    if (!customer.is_active) {
      throw new AppError('Customer is inactive', 'CUSTOMER_INACTIVE', 400);
    }

    const sale = await this.saleRepo.create({
      ...saleData,
      sold_by: userId,
    });

    if (sale.payment_status === 'CREDIT' || sale.payment_status === 'PARTIAL') {
      const creditAmount = sale.balance_due;
      await this.customerRepo.updateCreditBalance(sale.customer_id, creditAmount);
    }

    // Fire and forget webhook notification for all sales
    webhookService.notifyN8n('sale.created', {
      sale_id: sale.id,
      customer_id: sale.customer_id,
      total_amount: sale.total_amount,
      payment_status: sale.payment_status,
    }).catch(() => {
      // Errors are already handled in WebhookService, but catch here to be safe
    });

    // Fire and forget webhook notification for high-value sales (> 100000)
    if (sale.total_amount > 100000) {
      webhookService.notifyN8n('sale.high_value', {
        sale_id: sale.id,
        customer_id: sale.customer_id,
        customer_name: customer.name,
        total_amount: sale.total_amount,
        quantity_blocks: sale.quantity_blocks,
        unit_price: sale.unit_price,
        payment_status: sale.payment_status,
        balance_due: sale.balance_due,
      }).catch(() => {
        // Errors are already handled in WebhookService, but catch here to be safe
      });
    }

    return sale;
  }

  async getSales(limit = 50, offset = 0, filters?: {
    customerId?: string;
    paymentStatus?: string;
  }): Promise<Sale[]> {
    return this.saleRepo.findAll(limit, offset, filters);
  }

  async getSaleById(id: string): Promise<Sale> {
    const sale = await this.saleRepo.findById(id);

    if (!sale) {
      throw new AppError('Sale not found', 'SALE_NOT_FOUND', 404);
    }

    return sale;
  }
}



