import { BaseService } from './BaseService';
import { ApiResponse, User, AvailabilityResponse, VeterinarianDashboardStats } from './types';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface VeterinarianListParams {
    specialization?: string;
    emergency_only?: boolean;
    search?: string;
}

export interface VeterinarianProfileUpdateData {
    license_number?: string;
    specialization?: string;
    bio?: string;
    years_of_experience?: number;
    working_days?: string[];
    shift_start?: string;   // "HH:mm"
    shift_end?: string;     // "HH:mm"
    is_available_for_emergency?: boolean;
}

// ─── Service class ────────────────────────────────────────────────────────────

class VeterinarianService extends BaseService {

    /** GET /api/veterinarians — browse/search active vets */
    async getVeterinarians(params: VeterinarianListParams = {}): Promise<ApiResponse<User[]>> {
        return this.get<User[]>('/api/veterinarians', params as Record<string, unknown>);
    }

    /** GET /api/veterinarians/{userId} */
    async getVeterinarian(userId: number): Promise<ApiResponse<User>> {
        return this.get<User>(`/api/veterinarians/${userId}`);
    }

    /** PUT /api/veterinarians/{userId} — self (own profile) or Admin */
    async updateVeterinarianProfile(userId: number, data: VeterinarianProfileUpdateData): Promise<ApiResponse<User>> {
        return this.put<User>(`/api/veterinarians/${userId}`, data);
    }

    /** GET /api/veterinarians/{userId}/availability?date=YYYY-MM-DD */
    async getAvailability(userId: number, date: string): Promise<ApiResponse<AvailabilityResponse>> {
        return this.get<AvailabilityResponse>(`/api/veterinarians/${userId}/availability`, { date });
    }

    /** GET /api/veterinarian/dashboard — the logged-in vet's own dashboard stats */
    async getDashboard(): Promise<ApiResponse<VeterinarianDashboardStats>> {
        return this.get<VeterinarianDashboardStats>('/api/veterinarian/dashboard');
    }

    // ── Convenience wrappers ─────────────────────────────────────────────────

    async getEmergencyAvailableVets(): Promise<ApiResponse<User[]>> {
        return this.getVeterinarians({ emergency_only: true });
    }
}

export const veterinarianService = new VeterinarianService();
