import { getSupabaseClient } from '../config/supabase';
import { Customer, CustomerLedgerEntry } from '../types';
import { AppError } from '../middlewares/error.middleware';

export class CustomerRepository {
  private supabase = getSupabaseClient();

  async findAll(limit = 50, offset = 0, isActive?: boolean): Promise<Customer[]> {
    let query = this.supabase
      .from('customers')
      .select('*')
      .order('name')
      .range(offset, offset + limit - 1);

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(
        `Failed to fetch customers: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }

    if (!data || data.length === 0) {
      return [];
    }

    // For customers with credit due, fetch the oldest credit sale date
    // This represents when they first took credit (regardless of partial payments)
    const customersWithCredit = data.filter((c: any) => c.total_credit_due > 0);
    
    if (customersWithCredit.length > 0) {
      const customerIds = customersWithCredit.map((c: any) => c.id);
      
      // Fetch all credit/partial sales for these customers
      // We want the oldest one to know when credit was first taken
      const { data: creditSales, error: creditError } = await this.supabase
        .from('sales')
        .select('customer_id, created_at')
        .in('customer_id', customerIds)
        .or('payment_status.eq.CREDIT,payment_status.eq.PARTIAL')
        .order('created_at', { ascending: true });

      if (!creditError && creditSales && creditSales.length > 0) {
        // Group by customer_id and get the oldest (first) credit sale for each
        const oldestByCustomer = creditSales.reduce((acc: any, sale: any) => {
          if (!acc[sale.customer_id]) {
            acc[sale.customer_id] = sale;
          }
          return acc;
        }, {});

        // Add oldest_credit_date to each customer
        data.forEach((customer: any) => {
          if (oldestByCustomer[customer.id]) {
            customer.oldest_credit_date = oldestByCustomer[customer.id].created_at;
          }
        });
      }
    }

    return data || [];
  }

  async findById(id: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new AppError(
        `Failed to fetch customer: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }

    if (!data) {
      return null;
    }

    // If customer has credit due, fetch the oldest credit sale date
    // This represents when they first took credit
    if (data.total_credit_due > 0) {
      const { data: oldestCredit, error: creditError } = await this.supabase
        .from('sales')
        .select('created_at')
        .eq('customer_id', id)
        .or('payment_status.eq.CREDIT,payment_status.eq.PARTIAL')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (!creditError && oldestCredit) {
        (data as any).oldest_credit_date = oldestCredit.created_at;
      }
    }

    return data;
  }

  async create(customer: Partial<Customer>): Promise<Customer> {
    const { data, error } = await this.supabase
      .from('customers')
      .insert([{
        ...customer,
        total_credit_due: 0,
        days_overdue: 0,
        risk_level: 'LOW',
        is_active: true,
      }])
      .select()
      .single();

    if (error) {
      throw new AppError(
        `Failed to create customer: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }

    return data;
  }

  async update(id: string, updates: Partial<Customer>): Promise<Customer> {
    const { data, error } = await this.supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new AppError(
        `Failed to update customer: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }

    return data;
  }

  async updateCreditBalance(id: string, amount: number): Promise<void> {
    const customer = await this.findById(id);
    
    if (!customer) {
      throw new AppError('Customer not found', 'CUSTOMER_NOT_FOUND', 404);
    }

    const newCreditDue = customer.total_credit_due + amount;

    const { error } = await this.supabase
      .from('customers')
      .update({ total_credit_due: newCreditDue })
      .eq('id', id);

    if (error) {
      throw new AppError(
        `Failed to update credit balance: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }
  }

  async getLedger(customerId: string, startDate?: string, endDate?: string): Promise<CustomerLedgerEntry[]> {
    let query = this.supabase
      .from('customer_ledger_view')
      .select('*')
      .eq('customer_id', customerId)
      .order('date', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(
        `Failed to fetch ledger: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }

    return data || [];
  }
}

