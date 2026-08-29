import { BaseService } from './BaseService';
import { ApiResponse, ListParams, Payment, PaymentStatus, PaymentMethod } from './types';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface PaymentListParams extends ListParams {
    status?: PaymentStatus;
    date_from?: string;   // 'YYYY-MM-DD'
    date_to?: string;
}

/** Extra field returned only for Admins on the list endpoint */
export interface PaymentListResponseExtra {
    total_revenue?: number;
}

export interface PaymentCreateData {
    appointment_id: number;
    amount: number;
    currency?: string;
    payment_method: PaymentMethod;
    transaction_reference?: string;
    receipt?: File;
    notes?: string;
}

export interface MarkPaidData {
    transaction_reference?: string;
}

// ─── Service class ────────────────────────────────────────────────────────────

class PaymentService extends BaseService {

    private toFormData(data: PaymentCreateData): FormData {
        const fd = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (key === 'receipt') {
                if (value instanceof File) fd.append('receipt', value);
                return;
            }
            fd.append(key, String(value));
        });
        return fd;
    }

    /** GET /api/payments (Admin responses also include total_revenue) */
    async getPayments(params: PaymentListParams = {}): Promise<ApiResponse<Payment[]> & PaymentListResponseExtra> {
        const res = await this.get<Payment[]>('/api/payments', params as Record<string, unknown>);
        return res as ApiResponse<Payment[]> & PaymentListResponseExtra;
    }

    /** GET /api/payments/{id} */
    async getPayment(id: number): Promise<ApiResponse<Payment>> {
        return this.get<Payment>(`/api/payments/${id}`);
    }

    /** POST /api/payments (multipart) — Pet Owner initiates payment for an appointment */
    async createPayment(data: PaymentCreateData): Promise<ApiResponse<Payment>> {
        return this.postFormData<Payment>('/api/payments', this.toFormData(data));
    }

    /** POST /api/payments/{id}/mark-paid — Admin confirms payment received */
    async markPaid(id: number, data: MarkPaidData = {}): Promise<ApiResponse<Payment>> {
        return this.post<Payment>(`/api/payments/${id}/mark-paid`, data);
    }

    /** POST /api/payments/{id}/mark-failed — Admin */
    async markFailed(id: number): Promise<ApiResponse<Payment>> {
        return this.post<Payment>(`/api/payments/${id}/mark-failed`);
    }

    /** POST /api/payments/{id}/refund — Admin refunds a paid transaction */
    async refundPayment(id: number): Promise<ApiResponse<Payment>> {
        return this.post<Payment>(`/api/payments/${id}/refund`);
    }
}

export const paymentService = new PaymentService();
