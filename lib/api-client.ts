import { getAuthToken } from './auth';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api';
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { skipAuth, ...fetchOptions } = options;
    
    const url = `${this.baseURL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    if (!skipAuth) {
      const token = await getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || `HTTP error! status: ${response.status}`;
        const errorCode = data.code || `HTTP_${response.status}`;
        
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        
        if (response.status === 403) {
          throw new Error('You do not have permission to perform this action.');
        }
        
        throw new Error(errorMessage);
      }

      if (!data.success) {
        throw new Error(data.message || 'Request failed');
      }

      // For health endpoint, return the whole response since it doesn't have a data field
      if (endpoint.includes('/auth/health')) {
        const healthResult = { success: true, message: (data as any).message, timestamp: (data as any).timestamp } as T;
        return healthResult;
      }

      // Return data field if it exists, otherwise return the whole response
      return (data.data !== undefined ? data.data : data) as T;
    } catch (error: any) {
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check if the backend is running.');
      }
      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>, options?: RequestOptions): Promise<T> {
    let url = endpoint;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  sales = {
    create: async (data: {
      customer_id: string;
      quantity_blocks: number;
      unit_price: number;
      payment_status: 'CASH' | 'CREDIT' | 'PARTIAL';
      amount_paid?: number;
      notes?: string;
      sold_by?: string;
    }) => {
      return this.post<any>('/sales', data);
    },

    getAll: async (filters?: {
      limit?: number;
      offset?: number;
      customer_id?: string;
      payment_status?: 'CASH' | 'CREDIT' | 'PARTIAL';
    }) => {
      return this.get<any[]>('/sales', filters);
    },

    getById: async (id: string) => {
      return this.get<any>(`/sales/${id}`);
    },
  };

  customers = {
    getAll: async (filters?: {
      limit?: number;
      offset?: number;
      is_active?: boolean;
    }) => {
      return this.get<any[]>('/customers', filters);
    },

    getById: async (id: string) => {
      return this.get<any>(`/customers/${id}`);
    },

    getLedger: async (id: string, filters?: {
      start_date?: string;
      end_date?: string;
    }) => {
      return this.get<any[]>(`/customers/${id}/ledger`, filters);
    },

    create: async (data: {
      name: string;
      phone_number: string;
      email?: string;
      address?: string;
      credit_limit?: number;
      notes?: string;
    }) => {
      return this.post<any>('/customers', data);
    },
  };

  production = {
    create: async (data: {
      quantity_produced: number;
      waste_blocks: number;
      shift: 'Morning' | 'Afternoon' | 'Night';
      runtime_hours?: number;
      machine_issues?: string;
      notes?: string;
      production_date?: string;
    }) => {
      return this.post<any>('/production', data);
    },

    getAll: async (filters?: {
      limit?: number;
      offset?: number;
      start_date?: string;
      end_date?: string;
    }) => {
      return this.get<any[]>('/production', filters);
    },
  };

  fuel = {
    create: async (data: {
      liters_added: number;
      cost_per_liter: number;
      total_cost: number;
      generator_hours_run?: number;
      boxes_produced: number;
      supplier?: string;
      notes?: string;
      fuel_date?: string;
    }) => {
      return this.post<any>('/fuel', data);
    },

    getAll: async (filters?: {
      limit?: number;
      offset?: number;
      start_date?: string;
      end_date?: string;
    }) => {
      return this.get<any[]>('/fuel', filters);
    },
  };

  expenses = {
    create: async (data: {
      category: 'FUEL' | 'FOOD' | 'MAINTENANCE' | 'SUPPLIES' | 'OTHER';
      description: string;
      amount: number;
      currency?: string;
      vendor?: string;
      receipt_number?: string;
      notes?: string;
      expense_date?: string;
    }) => {
      return this.post<any>('/expenses', data);
    },

    getAll: async (filters?: {
      limit?: number;
      offset?: number;
      category?: string;
      start_date?: string;
      end_date?: string;
    }) => {
      return this.get<any[]>('/expenses', filters);
    },
  };

  fixedCosts = {
    create: async (data: {
      category: 'SALARY' | 'UTILITIES' | 'RENT' | 'SECURITY' | 'OTHER';
      description: string;
      amount: number;
      currency?: string;
      vendor?: string;
      receipt_number?: string;
      notes?: string;
      cost_date?: string;
    }) => {
      return this.post<any>('/fixed-costs', data);
    },

    getAll: async (filters?: {
      limit?: number;
      offset?: number;
      category?: string;
      start_date?: string;
      end_date?: string;
    }) => {
      return this.get<any[]>('/fixed-costs', filters);
    },
  };

  reports = {
    getDaily: async (date?: string) => {
      return this.get<any>('/reports/daily', date ? { date } : undefined);
    },

    getMonthly: async (month: number, year: number) => {
      return this.get<any>('/reports/monthly', { month, year });
    },

    getDashboard: async (startDate?: string, endDate?: string) => {
      const params: Record<string, string> = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      return this.get<any>('/reports/dashboard', Object.keys(params).length > 0 ? params : undefined);
    },

    getCustomer: async (id: string) => {
      return this.get<any>(`/reports/customer/${id}`);
    },
  };

  payments = {
    create: async (data: {
      customer_id: string;
      sale_id?: string;
      amount: number;
      payment_method?: 'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY';
      reference_number?: string;
      notes?: string;
    }) => {
      return this.post<any>('/payments', data);
    },

    getAll: async (filters?: {
      limit?: number;
      offset?: number;
      customer_id?: string;
    }) => {
      return this.get<any[]>('/payments', filters);
    },

    getById: async (id: string) => {
      return this.get<any>(`/payments/${id}`);
    },
  };

  auth = {
    health: async () => {
      return this.get<any>('/auth/health', undefined, { skipAuth: true });
    },

    verify: async (token: string) => {
      return this.post<any>('/auth/verify', { token }, { skipAuth: true });
    },
  };

  ai = {
    chat: async (message: string, history?: Array<{ role: string; parts: Array<any> }>) => {
      return this.post<{ response: string }>('/ai/chat', { message, history });
    },
  };
}

export const apiClient = new ApiClient();
export default apiClient;

