import { BaseService } from './BaseService';
import { ApiResponse, ListParams, User, UserRole, ApprovalStatus } from './types';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface UserListParams extends ListParams {
    role?: UserRole;
    approval_status?: ApprovalStatus;
    is_active?: boolean;
}

/** Admin creates a Veterinarian or Admin account (Pet Owners self-register instead) */
export interface UserCreateData {
    last_name: string;
    first_name: string;
    middle_name?: string;
    suffix?: string;
    email: string;
    phone_number?: string;
    address?: string;
    password: string;
    password_confirmation: string;
    role: 'veterinarian' | 'admin';
    profile_photo?: File;
    // Veterinarian-specific
    license_number?: string;
    specialization?: string;
    bio?: string;
    years_of_experience?: number;
    working_days?: string[];
    shift_start?: string;
    shift_end?: string;
}

export interface UserUpdateData {
    last_name?: string;
    first_name?: string;
    middle_name?: string;
    suffix?: string;
    email?: string;             // admin only
    phone_number?: string;
    address?: string;
    role?: UserRole;            // admin only
    is_active?: boolean;        // admin only
    profile_photo?: File;
    remove_photo?: boolean;
}

export interface ChangePasswordData {
    current_password: string;
    password: string;
    password_confirmation: string;
}

export interface RejectUserData {
    reason?: string;
}

// ─── Service class ────────────────────────────────────────────────────────────

class UserService extends BaseService {

    private toFormData(data: UserCreateData | UserUpdateData, method?: string): FormData {
        const fd = new FormData();
        if (method) fd.append('_method', method);

        Object.entries(data).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (key === 'profile_photo') {
                if (value instanceof File) fd.append('profile_photo', value);
                return;
            }
            if (key === 'working_days' && Array.isArray(value)) {
                value.forEach(day => fd.append('working_days[]', day));
                return;
            }
            if (typeof value === 'boolean') {
                fd.append(key, value ? '1' : '0');
                return;
            }
            fd.append(key, String(value));
        });

        return fd;
    }

    // ── Admin account management ────────────────────────────────────────────

    /** GET /api/users — Admin only */
    async getUsers(params: UserListParams = {}): Promise<ApiResponse<User[]>> {
        return this.get<User[]>('/api/users', params as Record<string, unknown>);
    }

    /** GET /api/users/{id} — Admin only */
    async getUser(id: number): Promise<ApiResponse<User>> {
        return this.get<User>(`/api/users/${id}`);
    }

    /** POST /api/users (multipart) — Admin creates a Veterinarian/Admin account */
    async createUser(data: UserCreateData): Promise<ApiResponse<User>> {
        return this.postFormData<User>('/api/users', this.toFormData(data));
    }

    /** POST /api/users/{id} (_method=PUT, multipart) — Admin or self update */
    async updateUser(id: number, data: UserUpdateData): Promise<ApiResponse<User>> {
        return this.postFormData<User>(`/api/users/${id}`, this.toFormData(data, 'PUT'));
    }

    /** DELETE /api/users/{id} — Admin only (soft delete) */
    async deleteUser(id: number): Promise<ApiResponse<null>> {
        return this.delete<null>(`/api/users/${id}`);
    }

    /** POST /api/users/{id}/approve — Admin approves a pending Pet Owner account */
    async approveUser(id: number): Promise<ApiResponse<User>> {
        return this.post<User>(`/api/users/${id}/approve`);
    }

    /** POST /api/users/{id}/reject — Admin rejects a pending Pet Owner account */
    async rejectUser(id: number, data: RejectUserData = {}): Promise<ApiResponse<User>> {
        return this.post<User>(`/api/users/${id}/reject`, data);
    }

    /** POST /api/users/{id}/toggle-active — Admin activates/deactivates any account */
    async toggleActiveUser(id: number): Promise<ApiResponse<User>> {
        return this.post<User>(`/api/users/${id}/toggle-active`);
    }

    // ── Self-service (any authenticated role) ───────────────────────────────

    /** GET /api/profile — the current user's own profile */
    async getProfile(): Promise<ApiResponse<User>> {
        return this.get<User>('/api/profile');
    }

    /** POST /api/profile (_method=PUT, multipart) — update own profile */
    async updateProfile(data: UserUpdateData): Promise<ApiResponse<User>> {
        return this.postFormData<User>('/api/profile', this.toFormData(data, 'PUT'));
    }

    /** POST /api/profile/change-password */
    async changePassword(data: ChangePasswordData): Promise<ApiResponse<null>> {
        return this.post<null>('/api/profile/change-password', data);
    }

    // ── Convenience wrappers ─────────────────────────────────────────────────

    async getPendingApprovals(params: ListParams = {}): Promise<ApiResponse<User[]>> {
        return this.getUsers({ ...params, role: 'pet_owner', approval_status: 'pending' });
    }

    async getPetOwners(params: UserListParams = {}): Promise<ApiResponse<User[]>> {
        return this.getUsers({ ...params, role: 'pet_owner' });
    }

    async getVeterinarianAccounts(params: UserListParams = {}): Promise<ApiResponse<User[]>> {
        return this.getUsers({ ...params, role: 'veterinarian' });
    }
}

export const userService = new UserService();
