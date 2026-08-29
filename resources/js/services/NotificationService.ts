import { BaseService } from './BaseService';
import { ApiResponse, ListParams, Notification, NotificationType } from './types';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface NotificationListParams extends ListParams {
    status?: 'unread';
    type?: NotificationType;
}

export interface NotificationListResponseExtra {
    unread_count?: number;
}

// ─── Service class ────────────────────────────────────────────────────────────

class NotificationService extends BaseService {

    /** GET /api/notifications */
    async getNotifications(params: NotificationListParams = {}): Promise<ApiResponse<Notification[]> & NotificationListResponseExtra> {
        const res = await this.get<Notification[]>('/api/notifications', params as Record<string, unknown>);
        return res as ApiResponse<Notification[]> & NotificationListResponseExtra;
    }

    /** GET /api/notifications/unread-count — lightweight badge counter */
    async getUnreadCount(): Promise<ApiResponse<null> & { count: number }> {
        const res = await this.get<null>('/api/notifications/unread-count');
        return res as ApiResponse<null> & { count: number };
    }

    /** POST /api/notifications/{id}/mark-read */
    async markRead(id: number): Promise<ApiResponse<Notification>> {
        return this.post<Notification>(`/api/notifications/${id}/mark-read`);
    }

    /** POST /api/notifications/mark-all-read */
    async markAllRead(): Promise<ApiResponse<null>> {
        return this.post<null>('/api/notifications/mark-all-read');
    }

    /** DELETE /api/notifications/{id} */
    async deleteNotification(id: number): Promise<ApiResponse<null>> {
        return this.delete<null>(`/api/notifications/${id}`);
    }

    // ── Convenience wrappers ─────────────────────────────────────────────────

    async getUnreadNotifications(perPage = 20): Promise<ApiResponse<Notification[]> & NotificationListResponseExtra> {
        return this.getNotifications({ status: 'unread', per_page: perPage });
    }
}

export const notificationService = new NotificationService();
