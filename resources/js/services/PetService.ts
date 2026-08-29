import { BaseService } from './BaseService';
import { ApiResponse, ListParams, Pet } from './types';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface PetListParams extends ListParams {
    owner_id?: number;
    species?: string;
    is_active?: boolean;
}

export interface MedicalRecordEntry {
    visit_date: string;
    service: string;
    follow_up_date?: string;
}

export interface PetCreateData {
    owner_id?: number;          // admin creating on behalf of an owner
    name: string;
    species: string;
    breed?: string;
    sex?: 'male' | 'female' | 'unknown';
    birth_date?: string;        // 'YYYY-MM-DD'
    weight_kg?: number;
    color?: string;
    photo?: File;
    allergies?: string;
    notes?: string;
    medical_records?: MedicalRecordEntry[];
}

export interface PetUpdateData extends Partial<PetCreateData> {
    remove_photo?: boolean;
    is_active?: boolean;
}

// ─── Service class ────────────────────────────────────────────────────────────

class PetService extends BaseService {

    private toFormData(data: PetCreateData | PetUpdateData, method?: string): FormData {
        const fd = new FormData();
        if (method) fd.append('_method', method);

        Object.entries(data).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (key === 'photo') {
                if (value instanceof File) fd.append('photo', value);
                return;
            }
            if (key === 'medical_records' && Array.isArray(value)) {
                value.forEach((record: any, i: number) => {
                    fd.append(`medical_records[${i}][visit_date]`, record.visit_date || '');
                    fd.append(`medical_records[${i}][service]`, record.service || '');
                    if (record.follow_up_date) fd.append(`medical_records[${i}][follow_up_date]`, record.follow_up_date);
                });
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

    /** GET /api/pets — Pet Owner sees own pets; Admin/Vet can filter by owner_id */
    async getPets(params: PetListParams = {}): Promise<ApiResponse<Pet[]>> {
        return this.get<Pet[]>('/api/pets', params as Record<string, unknown>);
    }

    /** GET /api/pets/{id} */
    async getPet(id: number): Promise<ApiResponse<Pet>> {
        return this.get<Pet>(`/api/pets/${id}`);
    }

    /** POST /api/pets (multipart) */
    async createPet(data: PetCreateData): Promise<ApiResponse<Pet>> {
        return this.postFormData<Pet>('/api/pets', this.toFormData(data));
    }

    /** POST /api/pets/{id} (_method=PUT, multipart) */
    async updatePet(id: number, data: PetUpdateData): Promise<ApiResponse<Pet>> {
        return this.postFormData<Pet>(`/api/pets/${id}`, this.toFormData(data, 'PUT'));
    }

    /** DELETE /api/pets/{id} */
    async deletePet(id: number): Promise<ApiResponse<null>> {
        return this.delete<null>(`/api/pets/${id}`);
    }
}

export const petService = new PetService();