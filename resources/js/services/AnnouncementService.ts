import { BaseService } from './BaseService';
import { ApiResponse, ListParams, Announcement } from './types';

// ─── Interfaces ───────────────────────────────────────────────────────────────

/**
 * Payload for creating an announcement (Admin → POST /api/announcements).
 * Sent as multipart/form-data when an image is attached.
 */
export interface AnnouncementCreateData {
    title: string;
    body: string;
    image?: File;
    start_date: string;             // 'YYYY-MM-DD' (required)
    end_date: string;               // 'YYYY-MM-DD' (required)
}

/** Payload for updating an announcement */
export interface AnnouncementUpdateData {
    title?: string;
    body?: string;
    image?: File | null;            // null = remove image
    remove_image?: boolean;
    start_date?: string;            // 'YYYY-MM-DD'
    end_date?: string;              // 'YYYY-MM-DD'
}

/** Query params for GET /api/announcements */
export interface AnnouncementListParams extends ListParams {
    search?: string;
}

// ─── Service class ────────────────────────────────────────────────────────────

class AnnouncementService extends BaseService {

    // ── Internal helpers ──────────────────────────────────────────────────────

    private toFormData(
        data: AnnouncementCreateData | AnnouncementUpdateData,
        method?: string
    ): FormData {
        const fd = new FormData();
        if (method) fd.append('_method', method);

        if ('title' in data && data.title)   fd.append('title', data.title);
        if ('body' in data && data.body)     fd.append('body', data.body);
        if ('start_date' in data && data.start_date) fd.append('start_date', data.start_date);
        if ('end_date' in data && data.end_date) fd.append('end_date', data.end_date);

        if (data.image instanceof File) {
            fd.append('image', data.image);
        } else if ('remove_image' in data && data.remove_image) {
            fd.append('remove_image', '1');
        }

        return fd;
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────

    /**
     * GET /api/announcements
     * Non-admins only receive published announcements.
     * Admins see all including drafts.
     */
    async getAnnouncements(params: AnnouncementListParams = {}): Promise<ApiResponse<Announcement[]>> {
        const qs = this.buildQueryString(params);
        return this.request<Announcement[]>(`${this.baseURL}/api/announcements?${qs}`);
    }

    /** GET /api/announcements/{id} */
    async getAnnouncement(id: number): Promise<ApiResponse<Announcement>> {
        return this.request<Announcement>(`${this.baseURL}/api/announcements/${id}`);
    }

    /**
     * POST /api/announcements (multipart)
     * Admin creates a new announcement with optional image.
     */
    async createAnnouncement(data: AnnouncementCreateData): Promise<ApiResponse<Announcement>> {
        return this.request<Announcement>(`${this.baseURL}/api/announcements`, {
            method: 'POST',
            body: this.toFormData(data),
        });
    }

    /**
     * POST /api/announcements/{id} (_method=PUT)
     * Admin edits an announcement. Pass image=null to remove the existing image.
     */
    async updateAnnouncement(id: number, data: AnnouncementUpdateData): Promise<ApiResponse<Announcement>> {
        const fd = this.toFormData(data, 'PUT');
        return this.request<Announcement>(`${this.baseURL}/api/announcements/${id}`, {
            method: 'POST',
            body: fd,
        });
    }

    /**
     * DELETE /api/announcements/{id}
     * Soft deletes the announcement (Laravel SoftDeletes).
     */
    async deleteAnnouncement(id: number): Promise<ApiResponse<null>> {
        return this.request<null>(`${this.baseURL}/api/announcements/${id}`, {
            method: 'DELETE',
        });
    }

    // ── Convenience Wrappers ──────────────────────────────────────────────────

    async getLatestAnnouncements(limit: number = 5): Promise<ApiResponse<Announcement[]>> {
        return this.getAnnouncements({ per_page: limit });
    }
}

export const announcementService = new AnnouncementService();
