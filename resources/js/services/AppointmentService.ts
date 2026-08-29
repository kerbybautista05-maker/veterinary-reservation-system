import { BaseService } from './BaseService';
import {
    ApiResponse, ListParams, Appointment, AppointmentStatus, AppointmentType, CalendarResponse,
} from './types';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface AppointmentListParams extends ListParams {
    status?: AppointmentStatus;
    type?: AppointmentType;
    pet_id?: number;
    date_from?: string;   // 'YYYY-MM-DD'
    date_to?: string;
}

export interface AppointmentCalendarParams {
    start: string;   // 'YYYY-MM-DD'
    end: string;     // 'YYYY-MM-DD'
    veterinarian_id?: number;
}

export interface AppointmentCreateData {
    pet_id: number;
    owner_id?: number;              // admin booking on behalf of an owner
    veterinarian_id?: number;
    appointment_date: string;       // 'YYYY-MM-DD'
    appointment_time: string;       // 'HH:mm'
    duration_minutes?: number;
    type?: AppointmentType;
    service_type?: string;
    reason?: string;
}

export interface AppointmentUpdateData {
    appointment_date?: string;
    appointment_time?: string;
    veterinarian_id?: number;
    service_type?: string;
    reason?: string;
    notes?: string;
}

export interface AppointmentRescheduleData {
    appointment_date: string;
    appointment_time: string;
}

export interface AppointmentCancelData {
    reason?: string;
}

export interface SlotCheckResponse {
    available: boolean;
    reason?: 'already_booked' | 'outside_business_hours' | null;
}

// ─── Service class ────────────────────────────────────────────────────────────

class AppointmentService extends BaseService {

    /** GET /api/appointments */
    async getAppointments(params: AppointmentListParams = {}): Promise<ApiResponse<Appointment[]>> {
        return this.get<Appointment[]>('/api/appointments', params as Record<string, unknown>);
    }

    /** GET /api/appointments/calendar?start=&end=&veterinarian_id= */
    async getCalendar(params: AppointmentCalendarParams): Promise<ApiResponse<CalendarResponse>> {
        return this.get<CalendarResponse>('/api/appointments/calendar', params as Record<string, unknown>);
    }

    /** GET /api/appointments/{id} */
    async getAppointment(id: number): Promise<ApiResponse<Appointment>> {
        return this.get<Appointment>(`/api/appointments/${id}`);
    }

    /** GET /api/appointments/check-slot?date=&time= */
    async checkSlot(date: string, time: string): Promise<ApiResponse<SlotCheckResponse>> {
        return this.get<SlotCheckResponse>('/api/appointments/check-slot', { date, time });
    }

    /** POST /api/appointments — book an appointment (Pet Owner), incl. emergency (type: 'emergency') */
    async bookAppointment(data: AppointmentCreateData): Promise<ApiResponse<Appointment>> {
        return this.post<Appointment>('/api/appointments', data);
    }

    /** PUT /api/appointments/{id} — edit while still pending/confirmed */
    async updateAppointment(id: number, data: AppointmentUpdateData): Promise<ApiResponse<Appointment>> {
        return this.put<Appointment>(`/api/appointments/${id}`, data);
    }

    /** POST /api/appointments/{id}/reschedule — creates a new linked appointment */
    async rescheduleAppointment(id: number, data: AppointmentRescheduleData): Promise<ApiResponse<Appointment>> {
        return this.post<Appointment>(`/api/appointments/${id}/reschedule`, data);
    }

    /** POST /api/appointments/{id}/cancel */
    async cancelAppointment(id: number, data: AppointmentCancelData = {}): Promise<ApiResponse<Appointment>> {
        return this.post<Appointment>(`/api/appointments/${id}/cancel`, data);
    }

    /** POST /api/appointments/{id}/confirm — Veterinarian or Admin */
    async confirmAppointment(id: number): Promise<ApiResponse<Appointment>> {
        return this.post<Appointment>(`/api/appointments/${id}/confirm`);
    }

    /** POST /api/appointments/{id}/complete — Veterinarian */
    async completeAppointment(id: number): Promise<ApiResponse<Appointment>> {
        return this.post<Appointment>(`/api/appointments/${id}/complete`);
    }

    /** POST /api/appointments/{id}/no-show */
    async markNoShow(id: number): Promise<ApiResponse<Appointment>> {
        return this.post<Appointment>(`/api/appointments/${id}/no-show`);
    }

    /** DELETE /api/appointments/{id} — Admin cleanup only */
    async deleteAppointment(id: number): Promise<ApiResponse<null>> {
        return this.delete<null>(`/api/appointments/${id}`);
    }

    /** GET /api/appointments/emergency/pending — Admin only */
    async getEmergencyPending(): Promise<ApiResponse<any[]>> {
        return this.get<any[]>('/api/appointments/emergency/pending');
    }

    /** POST /api/appointments/walk-in — Admin only */
    async logWalkIn(data: Record<string, any>): Promise<ApiResponse<Appointment>> {
        return this.post<Appointment>('/api/appointments/walk-in', data);
    }

    // ── Convenience wrappers ─────────────────────────────────────────────────

    async bookEmergencyAppointment(data: Omit<AppointmentCreateData, 'type'>): Promise<ApiResponse<Appointment>> {
        return this.bookAppointment({ ...data, type: 'emergency' });
    }

    async getUpcomingAppointments(params: AppointmentListParams = {}): Promise<ApiResponse<Appointment[]>> {
        return this.getAppointments({ ...params, status: 'confirmed' });
    }
}

export const appointmentService = new AppointmentService();
