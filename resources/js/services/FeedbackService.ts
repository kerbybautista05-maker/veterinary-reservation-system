import { BaseService } from './BaseService';
import { ApiResponse, ListParams, Feedback } from './types';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface FeedbackListParams extends ListParams {
    veterinarian_id?: number;
    min_rating?: number;
    include_unpublished?: boolean;   // Admin only
}

export interface FeedbackCreateData {
    appointment_id?: number;
    veterinarian_id?: number;
    rating: number;     // 1-5
    comment?: string;
}

export interface FeedbackRespondData {
    response: string;
}

// ─── Service class ────────────────────────────────────────────────────────────

class FeedbackService extends BaseService {

    /** GET /api/feedback */
    async getFeedback(params: FeedbackListParams = {}): Promise<ApiResponse<Feedback[]>> {
        return this.get<Feedback[]>('/api/feedback', params as Record<string, unknown>);
    }

    /** GET /api/feedback/{id} */
    async getFeedbackItem(id: number): Promise<ApiResponse<Feedback>> {
        return this.get<Feedback>(`/api/feedback/${id}`);
    }

    /** POST /api/feedback — Pet Owner submits feedback for a completed appointment */
    async submitFeedback(data: FeedbackCreateData): Promise<ApiResponse<Feedback>> {
        return this.post<Feedback>('/api/feedback', data);
    }

    /** POST /api/feedback/{id}/respond — Admin replies */
    async respondToFeedback(id: number, data: FeedbackRespondData): Promise<ApiResponse<Feedback>> {
        return this.post<Feedback>(`/api/feedback/${id}/respond`, data);
    }

    /** POST /api/feedback/{id}/toggle-publish — Admin publishes/hides */
    async togglePublish(id: number): Promise<ApiResponse<Feedback>> {
        return this.post<Feedback>(`/api/feedback/${id}/toggle-publish`);
    }

    /** DELETE /api/feedback/{id} — Admin only */
    async deleteFeedback(id: number): Promise<ApiResponse<null>> {
        return this.delete<null>(`/api/feedback/${id}`);
    }
}

export const feedbackService = new FeedbackService();
