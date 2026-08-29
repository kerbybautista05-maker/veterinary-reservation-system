import { BaseService } from './BaseService';
import { ApiResponse } from './types';

// ─── Report Types ─────────────────────────────────────────────────────────────

export interface ReportParams {
    from?: string;     // 'YYYY-MM-DD'
    to?: string;       // 'YYYY-MM-DD'
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface StatusCount {
    status: string;
    count: number;
    color: string;
}

export interface TrendPoint {
    date: string;
    count: number;
}

export interface PeakHour {
    hour: string;
    count: number;
}

export interface PeakDay {
    day: string;
    count: number;
}

export interface CancellationReason {
    cancellation_reason: string;
    count: number;
}

export interface ServiceCount {
    name: string;
    count: number;
}

export interface RevenueByService {
    name: string;
    revenue: number;
    count: number;
}

export interface RevenueOverTime {
    date: string;
    revenue: number;
    count: number;
}

export interface RevenueByMethod {
    payment_method: string;
    total: number;
    count: number;
}

export interface NewClientsPerMonth {
    month: string;
    count: number;
}

export interface PetSpecies {
    name: string;
    value: number;
}

export interface PetBreed {
    name: string;
    value: number;
}

export interface Overview {
    total_appointments: number;
    total_revenue: number;
    avg_rating: number;
    feedback_count: number;
    no_show_rate: number;
    cancellation_rate: number;
    no_show_count: number;
    cancelled_count: number;
    cancellation_reasons: CancellationReason[];
    appointments_by_status: StatusCount[];
    peak_hours: PeakHour[];
    peak_days: PeakDay[];
    avg_appointments_per_day: number;
    appointments_trend: TrendPoint[];
}

export interface ClientPetAnalytics {
    total_pet_owners: number;
    total_pets: number;
    total_staff: number;
    new_clients_per_month: NewClientsPerMonth[];
    pet_species: PetSpecies[];
    pet_breeds: PetBreed[];
}

export interface Operational {
    avg_booking_lead_time_hours: number;
    slot_utilization_rate: number;
    total_available_slots: number;
    date_span_days: number;
}

export interface ServiceTypeAnalytics {
    services: ServiceCount[];
    revenue_by_service: RevenueByService[];
}

export interface Revenue {
    total: number;
    over_time: RevenueOverTime[];
    by_payment_method: RevenueByMethod[];
}

export interface ReportsData {
    overview: Overview;
    clientPetAnalytics: ClientPetAnalytics;
    operational: Operational;
    serviceType: ServiceTypeAnalytics;
    revenue: Revenue;
}

export interface ReportsMeta {
    from: string;
    to: string;
    period: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

class ReportService extends BaseService {
    /** GET /api/admin/reports */
    async getReports(params: ReportParams = {}): Promise<ApiResponse<ReportsData>> {
        return this.get<ReportsData>('/api/admin/reports', params as Record<string, unknown>);
    }
}

export const reportService = new ReportService();
