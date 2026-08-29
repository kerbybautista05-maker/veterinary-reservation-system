import { BaseService } from './BaseService';
import { ApiResponse, ListParams, LoginLog, LoginLogStatus } from './types';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface LoginLogListParams extends ListParams {
    status?: LoginLogStatus;
    user_id?: number;
    ip?: string;
    email?: string;
    date_from?: string;   // 'YYYY-MM-DD'
    date_to?: string;
}

export interface FailedAttemptsResult {
    email: string;
    minutes: number;
    failed_attempts: number;
}

// ─── Service class ────────────────────────────────────────────────────────────

class LoginLogService extends BaseService {

    /** GET /api/login-logs — Admin only */
    async getLoginLogs(params: LoginLogListParams = {}): Promise<ApiResponse<LoginLog[]>> {
        return this.get<LoginLog[]>('/api/login-logs', params as Record<string, unknown>);
    }

    /** GET /api/login-logs/{id} */
    async getLoginLog(id: number): Promise<ApiResponse<LoginLog>> {
        return this.get<LoginLog>(`/api/login-logs/${id}`);
    }

    /** GET /api/login-logs/failed-attempts?email=&minutes= — brute-force check */
    async getRecentFailedAttempts(email: string, minutes = 15): Promise<ApiResponse<FailedAttemptsResult>> {
        return this.get<FailedAttemptsResult>('/api/login-logs/failed-attempts', { email, minutes });
    }
}

export const loginLogService = new LoginLogService();
