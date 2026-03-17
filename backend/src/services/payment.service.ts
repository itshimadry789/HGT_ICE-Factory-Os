import { PaymentRepository } from '../repositories/payment.repository';
import { CustomerRepository } from '../repositories/customer.repository';
import { Payment } from '../types';
import { AppError } from '../middlewares/error.middleware';

export class PaymentService {
  private paymentRepo = new PaymentRepository();
  private customerRepo = new CustomerRepository();

  async createPayment(paymentData: Partial<Payment>, userId?: string): Promise<Payment> {
    const customer = await this.customerRepo.findById(paymentData.customer_id || '');

    if (!customer) {
      throw new AppError('Customer not found', 'CUSTOMER_NOT_FOUND', 404);
    }

    if (!customer.is_active) {
      throw new AppError('Customer is inactive', 'CUSTOMER_INACTIVE', 400);
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      throw new AppError('Payment amount must be greater than 0', 'INVALID_AMOUNT', 400);
    }

    // Create the payment
    const payment = await this.paymentRepo.create({
      ...paymentData,
      received_by: userId,
    });

    // Update customer credit balance (reduce by payment amount)
    const newCreditDue = Math.max(0, customer.total_credit_due - payment.amount);
    
    // Update customer with new balance and last payment date
    await this.customerRepo.update(customer.id, {
      total_credit_due: newCreditDue,
      last_payment_date: new Date().toISOString(),
      days_overdue: 0, // Reset days overdue when payment is received
    });

    return payment;
  }

  async getPayments(limit = 50, offset = 0, filters?: {
    customerId?: string;
  }): Promise<Payment[]> {
    return this.paymentRepo.findAll(limit, offset, filters);
  }

  async getPaymentById(id: string): Promise<Payment> {
    const payment = await this.paymentRepo.findById(id);

    if (!payment) {
      throw new AppError('Payment not found', 'PAYMENT_NOT_FOUND', 404);
    }

    return payment;
  }
}
