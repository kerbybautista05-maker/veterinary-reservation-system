/**
 * services/index.ts — barrel re-export for the NE Veterinary Clinic service layer.
 *
 * Import everything your components need from this single entry point:
 *
 *   import {
 *     userService, veterinarianService, petService, appointmentService,
 *     petMedicalRecordService, healthReminderService, feedbackService,
 *     paymentService, chatService, announcementService, notificationService,
 *     activityLogService, loginLogService,
 *     type User, type Pet, type Appointment,
 *   } from '@/services';
 *
 * Route reference (api.php):
 *   /api/profile                     UserController.me / update / changePassword
 *   /api/users                       UserController (Admin account management)
 *   /api/pets                        PetController — NOT YET GENERATED, routes are
 *                                     commented out in api.php; petService is written
 *                                     against the intended contract for when it lands.
 *   /api/pets/{petId}/medical-records
 *   /api/medical-records              PetMedicalRecordController
 *   /api/veterinarians                VeterinarianProfileController
 *   /api/veterinarian/dashboard       VeterinarianProfileController.dashboard
 *   /api/appointments                 AppointmentController
 *   /api/health-reminders             HealthReminderController
 *   /api/feedback                     FeedbackController
 *   /api/payments                     PaymentController
 *   /api/chat/conversations           ChatConversationController + ChatMessageController (nested)
 *   /api/announcements                AnnouncementController
 *   /api/notifications                NotificationController
 *   /api/activity-logs                ActivityLogController (Admin)
 *   /api/login-logs                   LoginLogController (Admin)
 *
 * NOTE: There is no BranchService — the vet clinic schema has no `branches`
 * table (that was specific to the old tutoring-system domain).
 */

// ─── Base ─────────────────────────────────────────────────────────────────────
export { BaseService } from './BaseService';

// ─── Types (all shared interfaces, enums, and UI helpers) ─────────────────────
export type {
    // API envelope
    ApiResponse,
    PaginationData,
    ListParams,

    // Enums / union types
    UserRole,
    ApprovalStatus,
    PetSex,
    AppointmentType,
    AppointmentStatus,
    HealthReminderType,
    PaymentMethod,
    PaymentStatus,
    ChatConversationStatus,
    NotificationType,
    NotificationChannel,
    LoginLogStatus,
    NameSuffix,

    // Inertia shared data
    SharedData,

    // Domain models
    User,
    UserSummary,
    VeterinarianProfile,
    AvailabilitySlot,
    AvailabilityResponse,
    VeterinarianDashboardStats,
    Pet,
    Appointment,
    AppointmentStatusLog,
    CalendarResponse,
    PetMedicalRecord,
    HealthReminder,
    Feedback,
    Payment,
    ChatConversation,
    ChatMessage,
    Announcement,
    Notification,
    ActivityLog,
    LoginLog,

    // UI helpers
    StatusBadge,
    NavItem,
    BreadcrumbItem,
    ToastMessage,
    ChartDataPoint,
} from './types';

// Re-export value (not just type) for the SUFFIX_OPTIONS constant
export { SUFFIX_OPTIONS } from './types';

// ─── UserService ──────────────────────────────────────────────────────────────
// Self-service profile (any role) + Admin account management.
//
// Key methods:
//   userService.getProfile() / updateProfile(data) / changePassword(data)
//   userService.getUsers(params)              → Admin: paginated list, filterable
//   userService.createUser(data)              → Admin creates Vet/Admin account
//   userService.updateUser(id, data)          → Admin or self
//   userService.approveUser(id) / rejectUser(id, { reason })
//   userService.toggleActiveUser(id)
//   userService.getPendingApprovals(params)   → convenience wrapper
//   userService.getPetOwners(params) / getVeterinarianAccounts(params)
export { userService } from './UserService';
export type {
    UserListParams,
    UserCreateData,
    UserUpdateData,
    ChangePasswordData,
    RejectUserData,
} from './UserService';

// ─── VeterinarianService ───────────────────────────────────────────────────────
// Browse/search vets, self/admin profile edits, computed availability, dashboard.
//
// Key methods:
//   veterinarianService.getVeterinarians(params)
//   veterinarianService.getVeterinarian(userId)
//   veterinarianService.updateVeterinarianProfile(userId, data)
//   veterinarianService.getAvailability(userId, date)  → open time slots
//   veterinarianService.getDashboard()                 → own dashboard stats
export { veterinarianService } from './VeterinarianService';
export type {
    VeterinarianListParams,
    VeterinarianProfileUpdateData,
} from './VeterinarianService';

// ─── PetService ─────────────────────────────────────────────────────────────────
// NOTE: backend PetController not yet generated — see comment at top of file.
export { petService } from './PetService';
export type {
    PetListParams,
    PetCreateData,
    PetUpdateData,
} from './PetService';

// ─── AppointmentService ────────────────────────────────────────────────────────
// Booking, calendar, reschedule, cancel, confirm, complete, no-show.
//
// Key methods:
//   appointmentService.getAppointments(params)
//   appointmentService.getCalendar({ start, end, veterinarian_id })
//   appointmentService.bookAppointment(data) / bookEmergencyAppointment(data)
//   appointmentService.updateAppointment(id, data)
//   appointmentService.rescheduleAppointment(id, data)
//   appointmentService.cancelAppointment(id, { reason })
//   appointmentService.confirmAppointment(id) / completeAppointment(id) / markNoShow(id)
export { appointmentService } from './AppointmentService';
export type {
    AppointmentListParams,
    AppointmentCalendarParams,
    AppointmentCreateData,
    AppointmentUpdateData,
    AppointmentRescheduleData,
    AppointmentCancelData,
} from './AppointmentService';

// ─── PetMedicalRecordService ───────────────────────────────────────────────────
// Per-pet medical history + Veterinarian patient search.
//
// Key methods:
//   petMedicalRecordService.getRecordsForPet(petId, params)
//   petMedicalRecordService.createRecord(petId, data)   → multipart, supports attachments
//   petMedicalRecordService.searchPatients(query)       → "Search Patient Information"
//   petMedicalRecordService.updateRecord(id, data) / deleteRecord(id)
export { petMedicalRecordService } from './PetMedicalRecordService';
export type {
    MedicalRecordCreateData,
    MedicalRecordUpdateData,
} from './PetMedicalRecordService';

// ─── HealthReminderService ─────────────────────────────────────────────────────
// Vaccination / deworming / checkup reminders per pet.
//
// Key methods:
//   healthReminderService.getReminders(params)
//   healthReminderService.createReminder(data) / updateReminder(id, data)
//   healthReminderService.completeReminder(id)   → auto-creates next occurrence if recurring
//   healthReminderService.getOverdueReminders(petId?) / getDueSoonReminders(days, petId?)
//   healthReminderService.sendDueReminders()     → Admin/cron trigger
export { healthReminderService } from './HealthReminderService';
export type {
    HealthReminderListParams,
    HealthReminderCreateData,
    HealthReminderUpdateData,
} from './HealthReminderService';

// ─── FeedbackService ────────────────────────────────────────────────────────────
// Ratings & comments on appointments/veterinarians, admin responses.
//
// Key methods:
//   feedbackService.getFeedback(params)
//   feedbackService.submitFeedback(data)          → Pet Owner
//   feedbackService.respondToFeedback(id, data)   → Admin
//   feedbackService.togglePublish(id)             → Admin
export { feedbackService } from './FeedbackService';
export type {
    FeedbackListParams,
    FeedbackCreateData,
    FeedbackRespondData,
} from './FeedbackService';

// ─── PaymentService ─────────────────────────────────────────────────────────────
// Appointment payment transactions.
//
// Key methods:
//   paymentService.getPayments(params)   → Admin responses include total_revenue
//   paymentService.createPayment(data)   → multipart, supports receipt upload
//   paymentService.markPaid(id, data) / markFailed(id) / refundPayment(id)
export { paymentService } from './PaymentService';
export type {
    PaymentListParams,
    PaymentListResponseExtra,
    PaymentCreateData,
    MarkPaidData,
} from './PaymentService';

// ─── ChatService ─────────────────────────────────────────────────────────────────
// Live chat — Pet Owner ↔ Admin conversations and messages.
//
// Key methods:
//   chatService.getConversations(params)
//   chatService.startConversation()                    → Pet Owner
//   chatService.getConversation(id)                     → marks messages read
//   chatService.assignConversation(id) / closeConversation(id) / reopenConversation(id)
//   chatService.getMessages(conversationId, params)
//   chatService.sendMessage(conversationId, data)        → supports attachment
//   chatService.getUnassignedConversations() / getMyAssignedConversations()
export { chatService } from './ChatService';
export type {
    ConversationListParams,
    MessageListParams,
    SendMessageData,
} from './ChatService';

// ─── AnnouncementService ───────────────────────────────────────────────────────
// Clinic-wide announcements — Admin manages, Pet Owners/Vets see published only.
//
// Key methods:
//   announcementService.getAnnouncements(params)
//   announcementService.createAnnouncement(data) / updateAnnouncement(id, data)
//   announcementService.deleteAnnouncement(id)
//   announcementService.getLatestAnnouncements(limit)
export { announcementService } from './AnnouncementService';
export type {
    AnnouncementCreateData,
    AnnouncementUpdateData,
    AnnouncementListParams,
} from './AnnouncementService';

// ─── NotificationService ───────────────────────────────────────────────────────
// The authenticated user's own notification inbox.
//
// Key methods:
//   notificationService.getNotifications(params) / getUnreadNotifications(perPage)
//   notificationService.getUnreadCount()          → badge counter
//   notificationService.markRead(id) / markAllRead()
export { notificationService } from './NotificationService';
export type {
    NotificationListParams,
    NotificationListResponseExtra,
} from './NotificationService';

// ─── ActivityLogService ─────────────────────────────────────────────────────────
// Admin-facing system-wide audit trail.
//
// Key methods:
//   activityLogService.getActivityLogs(params)
//   activityLogService.getSubjectHistory({ type, id })   → history for one record
export { activityLogService } from './ActivityLogService';
export type {
    ActivityLogListParams,
    SubjectHistoryParams,
} from './ActivityLogService';

// ─── LoginLogService ────────────────────────────────────────────────────────────
// Admin-facing login attempt history.
//
// Key methods:
//   loginLogService.getLoginLogs(params)
//   loginLogService.getRecentFailedAttempts(email, minutes)
export { loginLogService } from './LoginLogService';
export type {
    LoginLogListParams,
    FailedAttemptsResult,
} from './LoginLogService';

// ─── ReportService ─────────────────────────────────────────────────────────────
// Admin analytics — aggregated reports for dashboard.
//
// Key methods:
//   reportService.getReports({ from, to, period })
export { reportService } from './ReportService';
export type {
    ReportParams,
    ReportsData,
    ReportsMeta,
    Overview,
    ClientPetAnalytics,
    Operational,
    ServiceTypeAnalytics,
    Revenue,
} from './ReportService';
