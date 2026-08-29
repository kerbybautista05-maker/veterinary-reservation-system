// ─── Generic API Response ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: Record<string, string[]>;
    pagination?: PaginationData;
    code?: string;
    server_time?: string;
}

export interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number;
    to?: number;
}

// ─── Common Query Params ──────────────────────────────────────────────────────

export interface ListParams {
    page?: number;
    per_page?: number;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

// ─── Enums / Union Types ──────────────────────────────────────────────────────

export type UserRole = 'pet_owner' | 'veterinarian' | 'admin';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type PetSex = 'male' | 'female' | 'unknown';

export type AppointmentType = 'regular' | 'emergency';
export type AppointmentStatus =
    | 'pending'
    | 'confirmed'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'rescheduled'
    | 'no_show';

export type HealthReminderType = 'vaccination' | 'deworming' | 'checkup' | 'medication' | 'grooming' | 'other';

export type PaymentMethod = 'cash' | 'gcash' | 'paymaya' | 'credit_card' | 'debit_card' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';

export type ChatConversationStatus = 'open' | 'pending' | 'closed';

export type NotificationType =
    | 'account_approval'
    | 'appointment_reminder'
    | 'appointment_update'
    | 'appointment_cancellation'
    | 'health_reminder'
    | 'payment_update'
    | 'feedback_response'
    | 'announcement'
    | 'general';

export type NotificationChannel = 'app' | 'email' | 'both';

export type LoginLogStatus = 'success' | 'failed';

/** Suffix options for user name */
export type NameSuffix = 'Jr.' | 'Sr.' | 'II' | 'III' | 'IV' | '';
export const SUFFIX_OPTIONS: NameSuffix[] = ['', 'Jr.', 'Sr.', 'II', 'III', 'IV'];

// ─── Shared Inertia / Auth Data ───────────────────────────────────────────────

export interface SharedData {
    auth: {
        user: User;
    };
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
    errors?: Record<string, string>;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
    id: number;
    last_name: string;
    first_name: string;
    middle_name?: string;
    suffix?: string;
    name?: string;              // server-computed
    full_name?: string;         // server-computed
    profile_photo_path?: string;
    profile_photo_url?: string;
    email: string;
    phone_number?: string;
    address?: string;
    role: UserRole;
    approval_status: ApprovalStatus;
    approved_by?: number | null;
    approved_at?: string | null;
    rejection_reason?: string | null;
    is_active: boolean;
    email_verified_at?: string | null;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    // Eager-loaded
    veterinarian_profile?: VeterinarianProfile;
}

export interface UserSummary {
    id: number;
    name?: string;
    full_name?: string;
    email?: string;
    profile_photo_url?: string;
    role?: UserRole;
}

// ─── VeterinarianProfile ──────────────────────────────────────────────────────

export interface VeterinarianProfile {
    id: number;
    user_id: number;
    license_number?: string;
    specialization?: string;
    bio?: string;
    years_of_experience?: number;
    /** JSON array of day names the vet is available, e.g. ["Monday","Tuesday"] */
    working_days?: string[] | null;
    shift_start?: string;   // "HH:mm"
    shift_end?: string;     // "HH:mm"
    is_available_for_emergency: boolean;
    created_at: string;
    updated_at: string;
    // Eager-loaded
    user?: User;
}

export interface AvailabilitySlot {
    time: string;      // "HH:mm"
    available: boolean;
}

export interface AvailabilityResponse {
    is_working: boolean;
    slots: AvailabilitySlot[];
}

export interface VeterinarianDashboardStats {
    todays_appointments: number;
    pending_appointments: number;
    total_patients: number;
    unread_notifications: number;
}

// ─── Pet ──────────────────────────────────────────────────────────────────────

export interface Pet {
    id: number;
    owner_id: number;
    name: string;
    species: string;
    breed?: string;
    sex: PetSex;
    birth_date?: string | null;   // 'YYYY-MM-DD'
    weight_kg?: string | null;
    color?: string;
    photo_path?: string;
    photo_url?: string;
    microchip_id?: string;
    is_neutered_or_spayed: boolean;
    allergies?: string;
    notes?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    // Server-computed
    age?: number | null;
    age_label?: string | null;
    // Eager-loaded
    owner?: User;
}

// ─── Appointment ──────────────────────────────────────────────────────────────

export interface Appointment {
    id: number;
    pet_id: number;
    owner_id: number;
    veterinarian_id?: number | null;
    appointment_date: string;    // 'YYYY-MM-DD'
    appointment_time: string;    // 'HH:mm:ss'
    duration_minutes: number;
    type: AppointmentType;
    status: AppointmentStatus;
    service_type?: string;
    reason?: string;
    cancellation_reason?: string;
    cancelled_at?: string | null;
    cancelled_by?: number | null;
    rescheduled_from_id?: number | null;
    notes?: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    // Server-computed
    status_label?: string;
    status_color?: string;
    is_emergency?: boolean;
    // Eager-loaded
    pet?: Pet;
    owner?: User;
    veterinarian?: User;
    status_logs?: AppointmentStatusLog[];
    medical_record?: PetMedicalRecord;
    payment?: Payment;
    feedback?: Feedback;
}

export interface AppointmentStatusLog {
    id: number;
    appointment_id: number;
    changed_by?: number | null;
    from_status?: string | null;
    to_status: string;
    remarks?: string;
    created_at: string;
    updated_at: string;
    transition_label?: string;
    changed_by_user?: UserSummary;
}

export type CalendarResponse = Record<string, Appointment[]>; // keyed by 'YYYY-MM-DD'

// ─── Pet Medical Record ────────────────────────────────────────────────────────

export interface PetMedicalRecord {
    id: number;
    pet_id: number;
    veterinarian_id: number;
    appointment_id?: number | null;
    service_type?: string | null;
    visit_date: string;
    weight_kg?: string | null;
    temperature_c?: string | null;
    symptoms?: string;
    diagnosis?: string;
    treatment?: string;
    prescription?: string;
    lab_results?: string;
    attachments?: string[] | null;
    notes?: string;
    follow_up_date?: string | null;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    // Eager-loaded
    pet?: Pet;
    veterinarian?: User;
    appointment?: Appointment;
}

// ─── Health Reminder ────────────────────────────────────────────────────────────

export interface HealthReminder {
    id: number;
    pet_id: number;
    owner_id: number;
    created_by?: number | null;
    type: HealthReminderType;
    title: string;
    description?: string;
    due_date: string;   // 'YYYY-MM-DD'
    is_recurring: boolean;
    recurrence_interval_days?: number | null;
    is_completed: boolean;
    completed_at?: string | null;
    reminder_sent: boolean;
    reminder_sent_at?: string | null;
    created_at: string;
    updated_at: string;
    // Server-computed
    is_overdue?: boolean;
    // Eager-loaded
    pet?: Pet;
    owner?: User;
    created_by_user?: UserSummary;
}

// ─── Feedback ────────────────────────────────────────────────────────────────

export interface Feedback {
    id: number;
    owner_id: number;
    appointment_id?: number | null;
    veterinarian_id?: number | null;
    rating: number;             // 1-5
    comment?: string;
    is_published: boolean;
    responded_by?: number | null;
    admin_response?: string | null;
    responded_at?: string | null;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    // Server-computed
    stars?: string;
    // Eager-loaded
    owner?: User;
    appointment?: Appointment;
    veterinarian?: User;
    responded_by_user?: UserSummary;
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export interface Payment {
    id: number;
    appointment_id: number;
    owner_id: number;
    amount: string;
    currency: string;
    payment_method: PaymentMethod;
    status: PaymentStatus;
    transaction_reference?: string;
    receipt_path?: string;
    paid_at?: string | null;
    notes?: string;
    created_at: string;
    updated_at: string;
    // Server-computed
    receipt_url?: string | null;
    status_label?: string;
    status_color?: string;
    // Eager-loaded
    appointment?: Appointment;
    owner?: User;
}

// ─── Live Chat ───────────────────────────────────────────────────────────────

export interface ChatConversation {
    id: number;
    owner_id: number;
    admin_id?: number | null;
    status: ChatConversationStatus;
    last_message_at?: string | null;
    created_at: string;
    updated_at: string;
    // Server-computed (added by controller)
    unread_count?: number;
    // Eager-loaded
    owner?: User;
    admin?: User;
    messages?: ChatMessage[];
    latest_message?: ChatMessage;
}

export interface ChatMessage {
    id: number;
    conversation_id: number;
    sender_id: number;
    message?: string | null;
    attachment_path?: string;
    attachment_name?: string;
    is_read: boolean;
    read_at?: string | null;
    created_at: string;
    updated_at: string;
    // Server-computed
    attachment_url?: string | null;
    // Eager-loaded
    sender?: User;
}

// ─── Announcement ────────────────────────────────────────────────────────────

export interface Announcement {
    id: number;
    created_by: number;
    updated_by?: number | null;
    title: string;
    body: string;
    image_path?: string;
    is_published: boolean;
    published_at?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    // Server-computed
    image_url?: string | null;
    status_label?: string;
    status_color?: string;
    excerpt?: string;
    formatted_published_at?: string | null;
    // Eager-loaded
    author?: UserSummary;
    editor?: UserSummary;
}

// ─── Notification ────────────────────────────────────────────────────────────

export interface Notification {
    id: number;
    user_id: number;
    title: string;
    message: string;
    type: NotificationType;
    notifiable_type?: string | null;
    notifiable_id?: number | null;
    deep_link?: string | null;
    channel: NotificationChannel;
    email_sent: boolean;
    email_sent_at?: string | null;
    is_read: boolean;
    read_at?: string | null;
    created_at: string;
    updated_at: string;
}

// ─── Activity Log (Audit Trail) ───────────────────────────────────────────────

export interface ActivityLog {
    id: number;
    user_id?: number | null;
    action: string;
    subject_type?: string | null;
    subject_id?: number | null;
    old_values?: Record<string, unknown> | null;
    new_values?: Record<string, unknown> | null;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
    updated_at: string;
    // Eager-loaded
    user?: UserSummary;
}

// ─── Login Log ─────────────────────────────────────────────────────────────────

export interface LoginLog {
    id: number;
    user_id?: number | null;
    email?: string;
    status: LoginLogStatus;
    ip_address?: string;
    user_agent?: string;
    logged_in_at: string;
    created_at: string;
    updated_at: string;
    // Eager-loaded
    user?: UserSummary;
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

export interface StatusBadge    { label: string; color: string; }
export interface NavItem        { title: string; href: string; icon?: unknown; badge?: string | number; children?: NavItem[]; }
export interface BreadcrumbItem { label: string; href?: string; active?: boolean; }
export interface ToastMessage   { type: 'success' | 'error' | 'warning' | 'info'; message: string; duration?: number; }
export interface ChartDataPoint { label: string; value: number; color?: string; }
