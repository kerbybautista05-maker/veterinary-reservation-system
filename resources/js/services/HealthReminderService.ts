import { BaseService } from './BaseService';
import { ApiResponse, ListParams, HealthReminder, HealthReminderType } from './types';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface HealthReminderListParams extends ListParams {
    pet_id?: number;
    status?: 'pending' | 'completed' | 'overdue' | 'due_soon';
    days?: number;   // used with status = 'due_soon'
}

export interface HealthReminderCreateData {
    pet_id: number;
    type: HealthReminderType;
    title: string;
    description?: string;
    due_date: string;    // 'YYYY-MM-DD'
    is_recurring?: boolean;
    recurrence_interval_days?: number;
}

export interface HealthReminderUpdateData {
    type?: HealthReminderType;
    title?: string;
    description?: string;
    due_date?: string;
    is_recurring?: boolean;
    recurrence_interval_days?: number;
}

// ─── Service class ────────────────────────────────────────────────────────────

class HealthReminderService extends BaseService {

    /** GET /api/health-reminders */
    async getReminders(params: HealthReminderListParams = {}): Promise<ApiResponse<HealthReminder[]>> {
        return this.get<HealthReminder[]>('/api/health-reminders', params as Record<string, unknown>);
    }

    /** GET /api/health-reminders/{id} */
    async getReminder(id: number): Promise<ApiResponse<HealthReminder>> {
        return this.get<HealthReminder>(`/api/health-reminders/${id}`);
    }

    /** POST /api/health-reminders */
    async createReminder(data: HealthReminderCreateData): Promise<ApiResponse<HealthReminder>> {
        return this.post<HealthReminder>('/api/health-reminders', data);
    }

    /** PUT /api/health-reminders/{id} */
    async updateReminder(id: number, data: HealthReminderUpdateData): Promise<ApiResponse<HealthReminder>> {
        return this.put<HealthReminder>(`/api/health-reminders/${id}`, data);
    }

    /** POST /api/health-reminders/{id}/complete — auto-creates the next occurrence if recurring */
    async completeReminder(id: number): Promise<ApiResponse<HealthReminder>> {
        return this.post<HealthReminder>(`/api/health-reminders/${id}/complete`);
    }

    /** DELETE /api/health-reminders/{id} */
    async deleteReminder(id: number): Promise<ApiResponse<null>> {
        return this.delete<null>(`/api/health-reminders/${id}`);
    }

    /** POST /api/health-reminders/send-due — Admin/cron trigger for reminder emails */
    async sendDueReminders(): Promise<ApiResponse<null>> {
        return this.post<null>('/api/health-reminders/send-due');
    }

    // ── Convenience wrappers ─────────────────────────────────────────────────

    async getOverdueReminders(petId?: number): Promise<ApiResponse<HealthReminder[]>> {
        return this.getReminders({ status: 'overdue', pet_id: petId });
    }

    async getDueSoonReminders(days = 7, petId?: number): Promise<ApiResponse<HealthReminder[]>> {
        return this.getReminders({ status: 'due_soon', days, pet_id: petId });
    }
}

export const healthReminderService = new HealthReminderService();
