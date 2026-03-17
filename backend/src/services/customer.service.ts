import { CustomerRepository } from '../repositories/customer.repository';
import { Customer, CustomerLedgerEntry } from '../types';
import { AppError } from '../middlewares/error.middleware';

export class CustomerService {
  private customerRepo = new CustomerRepository();

  async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    const existingCustomer = await this.customerRepo.findAll(1, 0, true);
    const duplicate = existingCustomer.find(
      c => c.phone_number === customerData.phone_number
    );

    if (duplicate) {
      throw new AppError(
        'Customer with this phone number already exists',
        'DUPLICATE_CUSTOMER',
        400
      );
    }

    return this.customerRepo.create(customerData);
  }

  async getCustomers(limit = 50, offset = 0, isActive?: boolean): Promise<Customer[]> {
    return this.customerRepo.findAll(limit, offset, isActive);
  }

  async getCustomerById(id: string): Promise<Customer> {
    const customer = await this.customerRepo.findById(id);

    if (!customer) {
      throw new AppError('Customer not found', 'CUSTOMER_NOT_FOUND', 404);
    }

    return customer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const customer = await this.customerRepo.findById(id);

    if (!customer) {
      throw new AppError('Customer not found', 'CUSTOMER_NOT_FOUND', 404);
    }

    return this.customerRepo.update(id, updates);
  }

  async getCustomerLedger(
    customerId: string,
    startDate?: string,
    endDate?: string
  ): Promise<CustomerLedgerEntry[]> {
    const customer = await this.customerRepo.findById(customerId);

    if (!customer) {
      throw new AppError('Customer not found', 'CUSTOMER_NOT_FOUND', 404);
    }

    return this.customerRepo.getLedger(customerId, startDate, endDate);
  }
}

