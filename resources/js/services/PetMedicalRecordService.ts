import { BaseService } from './BaseService';
import { ApiResponse, ListParams, PetMedicalRecord, Pet } from './types';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface MedicalRecordCreateData {
    appointment_id?: number;
    service_type?: string;
    visit_date: string;      // 'YYYY-MM-DD'
    weight_kg?: number;
    temperature_c?: number;
    symptoms?: string;
    diagnosis?: string;
    treatment?: string;
    prescription?: string;
    lab_results?: string;
    notes?: string;
    follow_up_date?: string;
    attachments?: File[];
}

export interface MedicalRecordUpdateData {
    service_type?: string;
    visit_date?: string;
    weight_kg?: number;
    temperature_c?: number;
    symptoms?: string;
    diagnosis?: string;
    treatment?: string;
    prescription?: string;
    lab_results?: string;
    notes?: string;
    follow_up_date?: string;
}

// ─── Service class ────────────────────────────────────────────────────────────

class PetMedicalRecordService extends BaseService {

    private toFormData(data: MedicalRecordCreateData): FormData {
        const fd = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (key === 'attachments' && Array.isArray(value)) {
                (value as File[]).forEach(file => fd.append('attachments[]', file));
                return;
            }
            fd.append(key, String(value));
        });
        return fd;
    }

    /** GET /api/pets/{petId}/medical-records */
    async getRecordsForPet(petId: number, params: ListParams = {}): Promise<ApiResponse<PetMedicalRecord[]>> {
        return this.get<PetMedicalRecord[]>(`/api/pets/${petId}/medical-records`, params as Record<string, unknown>);
    }

    /** POST /api/pets/{petId}/medical-records (multipart) — Veterinarian */
    async createRecord(petId: number, data: MedicalRecordCreateData): Promise<ApiResponse<PetMedicalRecord>> {
        return this.postFormData<PetMedicalRecord>(`/api/pets/${petId}/medical-records`, this.toFormData(data));
    }

    /** GET /api/medical-records/search-patients?q= — Veterinarian */
    async searchPatients(query: string): Promise<ApiResponse<Pet[]>> {
        return this.get<Pet[]>('/api/medical-records/search-patients', { q: query });
    }

    /** GET /api/medical-records/{id} */
    async getRecord(id: number): Promise<ApiResponse<PetMedicalRecord>> {
        return this.get<PetMedicalRecord>(`/api/medical-records/${id}`);
    }

    /** PUT /api/medical-records/{id} — authoring Veterinarian or Admin */
    async updateRecord(id: number, data: MedicalRecordUpdateData): Promise<ApiResponse<PetMedicalRecord>> {
        return this.put<PetMedicalRecord>(`/api/medical-records/${id}`, data);
    }

    /** DELETE /api/medical-records/{id} */
    async deleteRecord(id: number): Promise<ApiResponse<null>> {
        return this.delete<null>(`/api/medical-records/${id}`);
    }
}

export const petMedicalRecordService = new PetMedicalRecordService();
