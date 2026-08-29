<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ─── PUBLIC ROUTES ───────────────────────────────────────────────────────────

Route::get('/', function () {
    return Inertia::render('Home', [
        'announcements' => \App\Models\Announcement::active()
            ->orderByDesc('published_at')
            ->limit(5)
            ->get()
            ->append(['image_url', 'excerpt']),
    ]);
})->name('home');

// Pet Owner self-registration ('register'/'login'/'logout' routes now live in
// routes/auth.php via RegisteredUserController / AuthenticatedSessionController).
Route::get('/veterinarians', fn () => Inertia::render('Public/Veterinarians'))->name('veterinarians');
Route::get('/emergency', fn () => Inertia::render('Public/Emergency'))->name('emergency');

// ═════════════════════════════════════════════════════════════════════════════
// PET OWNER ROUTES  (auth)
// ═════════════════════════════════════════════════════════════════════════════
Route::prefix('owner')->name('owner.')->middleware(['auth', 'role:pet_owner'])->group(function () {

    Route::get('/dashboard', fn () => Inertia::render('Owner/Dashboard'))->name('dashboard');
    Route::get('/profile',      fn () => Inertia::render('Owner/Profile'))->name('profile');
    Route::get('/profile/edit', fn () => Inertia::render('Owner/ProfileEdit'))->name('profile.edit');

    Route::get('/pets',           fn () => Inertia::render('Owner/Pets/Index'))->name('pets.index');
    Route::get('/pets/create',    fn () => Inertia::render('Owner/Pets/Create'))->name('pets.create');
    Route::get('/pets/{id}',      fn ($id) => Inertia::render('Owner/Pets/Show', ['petId' => $id]))->name('pets.show');
    Route::get('/pets/{id}/edit', fn ($id) => Inertia::render('Owner/Pets/Edit', ['petId' => $id]))->name('pets.edit');

    Route::get('/appointments',           fn () => Inertia::render('Owner/Appointments/Index'))->name('appointments.index');
    Route::get('/appointments/create',    fn () => Inertia::render('Owner/Appointments/Create'))->name('appointments.create');
    Route::get('/appointments/emergency', fn () => Inertia::render('Owner/Appointments/Emergency'))->name('appointments.emergency');
    Route::get('/appointments/{id}',      fn ($id) => Inertia::render('Owner/Appointments/Show', ['appointmentId' => $id]))->name('appointments.show');
    Route::get('/calendar',               fn () => Inertia::render('Owner/Calendar'))->name('calendar');

    Route::get('/health-reminders', fn () => Inertia::render('Owner/HealthReminders'))->name('health-reminders');

    Route::get('/feedback',        fn () => Inertia::render('Owner/Feedback/Index'))->name('feedback.index');
    Route::get('/feedback/create', fn () => Inertia::render('Owner/Feedback/Create'))->name('feedback.create');

    Route::get('/payments',        fn () => Inertia::render('Owner/Payments/Index'))->name('payments.index');
    Route::get('/payments/create', fn () => Inertia::render('Owner/Payments/Create'))->name('payments.create');
    Route::get('/payments/{id}',   fn ($id) => Inertia::render('Owner/Payments/Show', ['paymentId' => $id]))->name('payments.show');

    Route::get('/chat',      fn () => Inertia::render('Owner/Chat/Index'))->name('chat.index');
    Route::get('/chat/{id}', fn ($id) => Inertia::render('Owner/Chat/Show', ['conversationId' => $id]))->name('chat.show');

    Route::get('/notifications',      fn () => Inertia::render('Owner/Notifications'))->name('notifications');
    Route::get('/notifications/{id}', fn ($id) => Inertia::render('Owner/NotificationDetail', ['notificationId' => $id]))->name('notifications.show');

    Route::get('/announcements',      fn () => Inertia::render('Owner/Announcements'))->name('announcements');
    Route::get('/announcements/{id}', fn ($id) => Inertia::render('Owner/AnnouncementDetail', ['announcementId' => $id]))->name('announcements.show');
});

// ═════════════════════════════════════════════════════════════════════════════
// VETERINARIAN ROUTES  (auth)
// ═════════════════════════════════════════════════════════════════════════════
Route::prefix('vet')->name('vet.')->middleware(['auth', 'role:veterinarian'])->group(function () {

    Route::get('/dashboard', fn () => Inertia::render('Vet/Dashboard'))->name('dashboard');
    Route::get('/profile',      fn () => Inertia::render('Vet/Profile'))->name('profile');
    Route::get('/profile/edit', fn () => Inertia::render('Vet/ProfileEdit'))->name('profile.edit');

    Route::get('/appointments',      fn () => Inertia::render('Vet/Appointments/Index'))->name('appointments.index');
    Route::get('/appointments/{id}', fn ($id) => Inertia::render('Vet/Appointments/Show', ['appointmentId' => $id]))->name('appointments.show');
    Route::get('/calendar',          fn () => Inertia::render('Vet/Calendar'))->name('calendar');

    Route::get('/patients',              fn () => Inertia::render('Vet/Patients/Index'))->name('patients.index');
    Route::get('/patients/{petId}',      fn ($petId) => Inertia::render('Vet/Patients/Show', ['petId' => $petId]))->name('patients.show');
    Route::get('/patients/{petId}/records/create', fn ($petId) => Inertia::render('Vet/Patients/RecordCreate', ['petId' => $petId]))->name('patients.records.create');

    Route::get('/notifications', fn () => Inertia::render('Vet/Notifications'))->name('notifications');
    Route::get('/announcements', fn () => Inertia::render('Vet/Announcements'))->name('announcements');
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMINISTRATOR ROUTES  (auth)
// ═════════════════════════════════════════════════════════════════════════════
Route::prefix('admin')->name('admin.')->middleware(['auth', 'role:admin'])->group(function () {

    Route::get('/dashboard', fn () => Inertia::render('Admin/Dashboard'))->name('dashboard');

    // Pending account approvals
    Route::get('/approvals', fn () => Inertia::render('Admin/Approvals/Index'))->name('approvals.index');

    // Pet Owner accounts
    Route::get('/pet-owners',           fn () => Inertia::render('Admin/PetOwners/Index'))->name('pet-owners.index');
    Route::get('/pet-owners/{id}',      fn ($id) => Inertia::render('Admin/PetOwners/Show', ['ownerId' => $id]))->name('pet-owners.show');
    Route::get('/pet-owners/{id}/edit', fn ($id) => Inertia::render('Admin/PetOwners/Edit', ['ownerId' => $id]))->name('pet-owners.edit');

    // Veterinarian accounts
    Route::get('/veterinarians',           fn () => Inertia::render('Admin/Veterinarians/Index'))->name('veterinarians.index');
    Route::get('/veterinarians/create',    fn () => Inertia::render('Admin/Veterinarians/Create'))->name('veterinarians.create');
    Route::get('/veterinarians/{id}',      fn ($id) => Inertia::render('Admin/Veterinarians/Show', ['vetId' => $id]))->name('veterinarians.show');
    Route::get('/veterinarians/{id}/edit', fn ($id) => Inertia::render('Admin/Veterinarians/Edit', ['vetId' => $id]))->name('veterinarians.edit');

    // Pets
    Route::get('/pets',      fn () => Inertia::render('Admin/Pets/Index'))->name('pets.index');
    Route::get('/pets/{id}', fn ($id) => Inertia::render('Admin/Pets/Show', ['petId' => $id]))->name('pets.show');

    // Appointments
    Route::get('/appointments',      fn () => Inertia::render('Admin/Appointments/Index'))->name('appointments.index');
    Route::get('/appointments/{id}', fn ($id) => Inertia::render('Admin/Appointments/Show', ['appointmentId' => $id]))->name('appointments.show');
    Route::get('/calendar',          fn () => Inertia::render('Admin/Calendar'))->name('calendar');

    // Announcements
    Route::get('/announcements',           fn () => Inertia::render('Admin/Announcements/Index'))->name('announcements.index');
    Route::get('/announcements/create',    fn () => Inertia::render('Admin/Announcements/Create'))->name('announcements.create');
    Route::get('/announcements/{id}/edit', fn ($id) => Inertia::render('Admin/Announcements/Edit', ['announcementId' => $id]))->name('announcements.edit');

    // Feedback
    Route::get('/feedback', fn () => Inertia::render('Admin/Feedback/Index'))->name('feedback.index');

    // Payments / reports
    Route::get('/payments', fn () => Inertia::render('Admin/Payments/Index'))->name('payments.index');
    Route::get('/reports',  fn () => Inertia::render('Admin/Reports'))->name('reports');

    // Live chat management
    Route::get('/chat',      fn () => Inertia::render('Admin/Chat/Index'))->name('chat.index');
    Route::get('/chat/{id}', fn ($id) => Inertia::render('Admin/Chat/Show', ['conversationId' => $id]))->name('chat.show');

    // Notifications
    Route::get('/notifications',      fn () => Inertia::render('Admin/Notifications'))->name('notifications');
    Route::get('/notifications/{id}', fn ($id) => Inertia::render('Admin/NotificationDetail', ['notificationId' => $id]))->name('notifications.show');

    // Audit trail
    Route::get('/activity-logs', fn () => Inertia::render('Admin/ActivityLogs'))->name('activity-logs');
    Route::get('/login-logs',    fn () => Inertia::render('Admin/LoginLogs'))->name('login-logs');
});

require __DIR__ . '/auth.php';
require __DIR__ . '/settings.php';