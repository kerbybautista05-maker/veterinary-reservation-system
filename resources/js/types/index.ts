// @/types/index.ts

export interface SharedData {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role: 'admin' | 'staff' | 'client';
            phone?: string;
            email_verified_at?: string | null;
            created_at: string;
            updated_at: string;
        };
    };
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
    errors?: Record<string, string | string[]>;
    ziggy?: any; // For Laravel Ziggy routes
}