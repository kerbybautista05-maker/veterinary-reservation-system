import { BaseService } from './BaseService';
import { ApiResponse, ListParams, ActivityLog } from './types';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ActivityLogListParams extends ListParams {
    user_id?: number;
    action?: string;
    subject_type?: string;
    subject_id?: number;
    date_from?: string;   // 'YYYY-MM-DD'
    date_to?: string;
}

export interface SubjectHistoryParams {
    type: string;   // fully-qualified model class, e.g. 'App\\Models\\Appointment'
    id: number;
}

// ─── Service class ────────────────────────────────────────────────────────────

class ActivityLogService extends BaseService {

    /** GET /api/activity-logs — Admin only */
    async getActivityLogs(params: ActivityLogListParams = {}): Promise<ApiResponse<ActivityLog[]>> {
        return this.get<ActivityLog[]>('/api/activity-logs', params as Record<string, unknown>);
    }

    /** GET /api/activity-logs/{id} */
    async getActivityLog(id: number): Promise<ApiResponse<ActivityLog>> {
        return this.get<ActivityLog>(`/api/activity-logs/${id}`);
    }

    /** GET /api/activity-logs/subject?type=&id= — audit history for one record */
    async getSubjectHistory(params: SubjectHistoryParams): Promise<ApiResponse<ActivityLog[]>> {
        return this.get<ActivityLog[]>('/api/activity-logs/subject', params as unknown as Record<string, unknown>);
    }
}

export const activityLogService = new ActivityLogService();
