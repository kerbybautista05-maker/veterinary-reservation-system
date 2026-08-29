<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

// ── Controllers ─────────────────────────────────────────────────────────────
use App\Http\Controllers\UserController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\VeterinarianProfileController;
use App\Http\Controllers\PetMedicalRecordController;
use App\Http\Controllers\HealthReminderController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ChatConversationController;
use App\Http\Controllers\ChatMessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\LoginLogController;
use App\Http\Controllers\PetController;
use App\Http\Controllers\ReportController;

// Registration/login/logout are session-based (Inertia) flows handled by
// routes/auth.php via App\Http\Controllers\Auth\RegisteredUserController and
// App\Http\Controllers\Auth\AuthenticatedSessionController — not JSON API
// endpoints, so there is nothing to wire up here.

// ════════════════════════════════════════════════════════════════════════════
// PUBLIC API ROUTES  (no auth required)
// ════════════════════════════════════════════════════════════════════════════

// Forgot password (verification code flow)
Route::post('/forgot-password/send-code', [App\Http\Controllers\ForgotPasswordController::class, 'sendCode']);
Route::post('/forgot-password/verify-code', [App\Http\Controllers\ForgotPasswordController::class, 'verifyCode']);
Route::post('/forgot-password/reset', [App\Http\Controllers\ForgotPasswordController::class, 'resetPassword']);

// Published announcements — safe to show on a public landing page
Route::get('/public/announcements', function () {
    return response()->json([
        'success' => true,
        'data' => \App\Models\Announcement::published()
            ->with('author')
            ->orderByDesc('published_at')
            ->limit(10)
            ->get()
            ->append(['image_url', 'excerpt']),
    ]);
});

// Public veterinarian directory — for browsing before booking/registering
Route::get('/public/veterinarians', function () {
    return response()->json([
        'success' => true,
        'data' => \App\Models\User::veterinarians()->active()
            ->with('veterinarianProfile')
            ->orderBy('last_name')
            ->get()
            ->append(['name', 'full_name', 'profile_photo_url']),
    ]);
});

// ════════════════════════════════════════════════════════════════════════════
// AUTHENTICATED API ROUTES  (Sanctum / session)
// ════════════════════════════════════════════════════════════════════════════
Route::middleware([EnsureFrontendRequestsAreStateful::class, 'auth:sanctum'])->group(function () {

    Route::get('/user', fn (Request $request) => $request->user());

    // ── PROFILE (self-service, any authenticated role) ─────────────────────
    Route::get('/profile', [UserController::class, 'me']);
    Route::match(['put', 'post'], '/profile', function (Request $request) {
        return app(UserController::class)->update($request, $request->user()->id);
    });
    Route::post('/profile/change-password', [UserController::class, 'changePassword']);

    // ── PETS ─────────────────────────────────────────────────────────────
    Route::prefix('pets')->group(function () {
        Route::get('/',            [PetController::class, 'index']);
        Route::post('/',           [PetController::class, 'store']);
        Route::get('/{id}',        [PetController::class, 'show']);
        Route::match(['put', 'post'], '/{id}', [PetController::class, 'update']);
        Route::delete('/{id}',     [PetController::class, 'destroy']);

        Route::get('/{petId}/medical-records',  [PetMedicalRecordController::class, 'index']);
        Route::post('/{petId}/medical-records', [PetMedicalRecordController::class, 'store']);
    });

    Route::prefix('medical-records')->group(function () {
        Route::get('/search-patients', [PetMedicalRecordController::class, 'searchPatients']);
        Route::get('/{id}',            [PetMedicalRecordController::class, 'show']);
        Route::match(['put', 'post'], '/{id}', [PetMedicalRecordController::class, 'update']);
        Route::delete('/{id}',         [PetMedicalRecordController::class, 'destroy']);
    });

    // ── VETERINARIANS ────────────────────────────────────────────────────
    Route::prefix('veterinarians')->group(function () {
        Route::get('/',                     [VeterinarianProfileController::class, 'index']);
        Route::get('/{userId}',             [VeterinarianProfileController::class, 'show']);
        Route::match(['put', 'post'], '/{userId}', [VeterinarianProfileController::class, 'update']);
        Route::get('/{userId}/availability',[VeterinarianProfileController::class, 'availability']);
    });
    Route::get('/veterinarian/dashboard', [VeterinarianProfileController::class, 'dashboard']);

    // ── USERS (Admin account management) ────────────────────────────────
    Route::prefix('users')->group(function () {
        Route::get('/',                    [UserController::class, 'index']);
        Route::post('/',                   [UserController::class, 'store']);
        Route::get('/{id}',                [UserController::class, 'show']);
        Route::match(['put', 'post'], '/{id}', [UserController::class, 'update']);
        Route::delete('/{id}',             [UserController::class, 'destroy']);
        Route::post('/{id}/approve',       [UserController::class, 'approve']);
        Route::post('/{id}/reject',        [UserController::class, 'reject']);
        Route::post('/{id}/toggle-active', [UserController::class, 'toggleActive']);
    });

    // ── REPORTS (Admin analytics) ──────────────────────────────────────
    Route::get('/admin/reports', [ReportController::class, 'index']);

    // ── APPOINTMENTS ─────────────────────────────────────────────────────
    Route::prefix('appointments')->group(function () {
        Route::get('/',                [AppointmentController::class, 'index']);
        Route::get('/calendar',        [AppointmentController::class, 'calendar']);
        Route::get('/check-slot',      [AppointmentController::class, 'checkSlot']);
        Route::get('/emergency/pending', [AppointmentController::class, 'emergencyPending']);
        Route::post('/',               [AppointmentController::class, 'store']);
        Route::post('/walk-in',        [AppointmentController::class, 'storeWalkIn']);
        Route::get('/{id}',            [AppointmentController::class, 'show']);
        Route::match(['put', 'post'], '/{id}', [AppointmentController::class, 'update']);
        Route::post('/{id}/reschedule',[AppointmentController::class, 'reschedule']);
        Route::post('/{id}/cancel',    [AppointmentController::class, 'cancel']);
        Route::post('/{id}/confirm',   [AppointmentController::class, 'confirm']);
        Route::post('/{id}/complete',  [AppointmentController::class, 'complete']);
        Route::post('/{id}/no-show',   [AppointmentController::class, 'noShow']);
        Route::delete('/{id}',         [AppointmentController::class, 'destroy']);
    });

    // ── HEALTH REMINDERS ─────────────────────────────────────────────────
    Route::prefix('health-reminders')->group(function () {
        Route::get('/',            [HealthReminderController::class, 'index']);
        Route::post('/',           [HealthReminderController::class, 'store']);
        Route::post('/send-due',   [HealthReminderController::class, 'sendDueReminders']);
        Route::get('/{id}',        [HealthReminderController::class, 'show']);
        Route::match(['put', 'post'], '/{id}', [HealthReminderController::class, 'update']);
        Route::post('/{id}/complete', [HealthReminderController::class, 'complete']);
        Route::delete('/{id}',     [HealthReminderController::class, 'destroy']);
    });

    // ── FEEDBACK ─────────────────────────────────────────────────────────
    Route::prefix('feedback')->group(function () {
        Route::get('/',                  [FeedbackController::class, 'index']);
        Route::post('/',                 [FeedbackController::class, 'store']);
        Route::get('/{id}',              [FeedbackController::class, 'show']);
        Route::post('/{id}/respond',     [FeedbackController::class, 'respond']);
        Route::post('/{id}/toggle-publish', [FeedbackController::class, 'togglePublish']);
        Route::delete('/{id}',           [FeedbackController::class, 'destroy']);
    });

    // ── PAYMENTS ─────────────────────────────────────────────────────────
    Route::prefix('payments')->group(function () {
        Route::get('/',              [PaymentController::class, 'index']);
        Route::post('/',             [PaymentController::class, 'store']);
        Route::get('/{id}',          [PaymentController::class, 'show']);
        Route::post('/{id}/mark-paid',   [PaymentController::class, 'markPaid']);
        Route::post('/{id}/mark-failed', [PaymentController::class, 'markFailed']);
        Route::post('/{id}/refund',      [PaymentController::class, 'refund']);
    });

    // ── LIVE CHAT ────────────────────────────────────────────────────────
    Route::prefix('chat/conversations')->group(function () {
        Route::get('/',               [ChatConversationController::class, 'index']);
        Route::post('/',              [ChatConversationController::class, 'store']);
        Route::get('/{id}',           [ChatConversationController::class, 'show']);
        Route::post('/{id}/assign',   [ChatConversationController::class, 'assign']);
        Route::post('/{id}/close',    [ChatConversationController::class, 'close']);
        Route::post('/{id}/reopen',   [ChatConversationController::class, 'reopen']);

        Route::get('/{conversationId}/messages',           [ChatMessageController::class, 'index']);
        Route::post('/{conversationId}/messages',          [ChatMessageController::class, 'store']);
        Route::post('/{conversationId}/messages/mark-read',[ChatMessageController::class, 'markRead']);
    });
    Route::delete('/chat/messages/{id}', [ChatMessageController::class, 'destroy']);

    // ── ANNOUNCEMENTS ────────────────────────────────────────────────────
    Route::prefix('announcements')->group(function () {
        Route::get('/',            [AnnouncementController::class, 'index']);
        Route::get('/published',   [AnnouncementController::class, 'getPublished']);
        Route::post('/',           [AnnouncementController::class, 'store']);
        Route::get('/{id}',        [AnnouncementController::class, 'show']);
        Route::match(['put', 'post'], '/{id}', [AnnouncementController::class, 'update']);
        Route::delete('/{id}',     [AnnouncementController::class, 'destroy']);
    });

    // ── NOTIFICATIONS ────────────────────────────────────────────────────
    Route::prefix('notifications')->group(function () {
        Route::get('/',                [NotificationController::class, 'index']);
        Route::get('/unread-count',    [NotificationController::class, 'unreadCount']);
        Route::post('/mark-all-read',  [NotificationController::class, 'markAllRead']);
        Route::post('/{id}/mark-read', [NotificationController::class, 'markRead']);
        Route::delete('/{id}',         [NotificationController::class, 'destroy']);
    });

    // ── AUDIT TRAIL (Admin only) ─────────────────────────────────────────
    Route::prefix('activity-logs')->group(function () {
        Route::get('/',        [ActivityLogController::class, 'index']);
        Route::get('/subject', [ActivityLogController::class, 'forSubject']);
        Route::get('/{id}',    [ActivityLogController::class, 'show']);
    });

    // ── LOGIN LOGS (Admin only) ──────────────────────────────────────────
    Route::prefix('login-logs')->group(function () {
        Route::get('/',                 [LoginLogController::class, 'index']);
        Route::get('/failed-attempts',  [LoginLogController::class, 'recentFailedAttempts']);
        Route::get('/{id}',             [LoginLogController::class, 'show']);
    });

});