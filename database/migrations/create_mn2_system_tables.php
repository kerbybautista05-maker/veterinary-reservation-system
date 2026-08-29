<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {

    public function up(): void
    {
        // ══════════════════════════════════════════════════════════════════════
        // 1. USERS  (Pet Owner · Veterinarian · Administrator)
        // ══════════════════════════════════════════════════════════════════════
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('last_name', 100);
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('suffix', 20)->nullable();

            $table->string('profile_photo_path')->nullable();
            $table->string('email')->unique();
            $table->string('phone_number', 30)->nullable();
            $table->text('address')->nullable();
            $table->string('password');

            $table->enum('role', ['pet_owner', 'veterinarian', 'admin'])->default('pet_owner');

            // Pet Owner accounts require admin approval before they can log in
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->string('rejection_reason', 255)->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });

        // ══════════════════════════════════════════════════════════════════════
        // 2. VETERINARIAN PROFILES
        // ══════════════════════════════════════════════════════════════════════
        Schema::create('veterinarian_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();

            $table->string('license_number', 100)->unique()->nullable();
            $table->string('specialization', 150)->nullable();
            $table->text('bio')->nullable();
            $table->unsignedInteger('years_of_experience')->nullable();

            // JSON array of working days, e.g. ["Monday","Tuesday","Wednesday"]
            $table->json('working_days')->nullable()->comment('JSON array of day names the vet is available, e.g. ["Monday","Tuesday"]');
            $table->time('shift_start')->nullable();
            $table->time('shift_end')->nullable();
            $table->boolean('is_available_for_emergency')->default(false);

            $table->timestamps();
        });

        // ══════════════════════════════════════════════════════════════════════
        // 3. PETS
        // ══════════════════════════════════════════════════════════════════════
        Schema::create('pets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();

            $table->string('name', 150);
            $table->string('species', 100)->comment('e.g. Dog, Cat, Bird');
            $table->string('breed', 150)->nullable();
            $table->enum('sex', ['male', 'female', 'unknown'])->default('unknown');
            $table->date('birth_date')->nullable();
            $table->decimal('weight_kg', 6, 2)->nullable();
            $table->string('color', 100)->nullable();
            $table->string('photo_path')->nullable();
            $table->string('microchip_id', 100)->nullable();
            $table->boolean('is_neutered_or_spayed')->default(false);
            $table->text('allergies')->nullable();
            $table->text('notes')->nullable();

            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['owner_id', 'is_active']);
        });

        // ══════════════════════════════════════════════════════════════════════
        // 4. APPOINTMENTS
        // ══════════════════════════════════════════════════════════════════════
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pet_id')->constrained('pets')->cascadeOnDelete();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('veterinarian_id')->nullable()->constrained('users')->nullOnDelete();

            $table->date('appointment_date');
            $table->time('appointment_time');
            $table->unsignedInteger('duration_minutes')->default(30);

            $table->enum('type', ['regular', 'emergency'])->default('regular');
            $table->enum('status', [
                'pending',
                'confirmed',
                'in_progress',
                'completed',
                'cancelled',
                'rescheduled',
                'no_show',
            ])->default('pending');

            $table->string('service_type', 150)->nullable()->comment('e.g. Vaccination, Checkup, Grooming, Surgery');
            $table->text('reason')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();

            $table->foreignId('rescheduled_from_id')->nullable()->comment('Points to the original appointment if this one is a reschedule');
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('rescheduled_from_id')->references('id')->on('appointments')->nullOnDelete();
            $table->index(['appointment_date', 'appointment_time']);
            $table->index(['veterinarian_id', 'appointment_date']);
            $table->index('status');
        });

        // ══════════════════════════════════════════════════════════════════════
        // 5. APPOINTMENT STATUS HISTORY  (audit trail for booking/updates/cancellations)
        // ══════════════════════════════════════════════════════════════════════
        Schema::create('appointment_status_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained('appointments')->cascadeOnDelete();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('from_status', 30)->nullable();
            $table->string('to_status', 30);
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        // ══════════════════════════════════════════════════════════════════════
        // 6. PET MEDICAL RECORDS
        // ══════════════════════════════════════════════════════════════════════
        Schema::create('pet_medical_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pet_id')->constrained('pets')->cascadeOnDelete();
            $table->foreignId('veterinarian_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();

            $table->date('visit_date');
            $table->decimal('weight_kg', 6, 2)->nullable();
            $table->decimal('temperature_c', 5, 2)->nullable();
            $table->text('symptoms')->nullable();
            $table->text('diagnosis')->nullable();
            $table->text('treatment')->nullable();
            $table->text('prescription')->nullable();
            $table->text('lab_results')->nullable();
            $table->text('attachments')->nullable()->comment('Stored as JSON array of file paths');
            $table->text('notes')->nullable();
            $table->date('follow_up_date')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['pet_id', 'visit_date']);
        });

        // ══════════════════════════════════════════════════════════════════════
        // 7. HEALTH REMINDERS
        // ══════════════════════════════════════════════════════════════════════
        Schema::create('health_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pet_id')->constrained('pets')->cascadeOnDelete();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->enum('type', ['vaccination', 'deworming', 'checkup', 'medication', 'grooming', 'other'])->default('other');
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->date('due_date');

            $table->boolean('is_recurring')->default(false);
            $table->unsignedInteger('recurrence_interval_days')->nullable();

            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();

            $table->boolean('reminder_sent')->default(false);
            $table->timestamp('reminder_sent_at')->nullable();

            $table->timestamps();

            $table->index(['due_date', 'is_completed']);
        });

        // ══════════════════════════════════════════════════════════════════════
        // 8. FEEDBACK
        // ══════════════════════════════════════════════════════════════════════
        Schema::create('feedbacks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->foreignId('veterinarian_id')->nullable()->constrained('users')->nullOnDelete();

            $table->unsignedTinyInteger('rating')->comment('1-5 star rating');
            $table->text('comment')->nullable();
            $table->boolean('is_published')->default(true);

            $table->foreignId('responded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('admin_response')->nullable();
            $table->timestamp('responded_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });

        // ══════════════════════════════════════════════════════════════════════
        // 9. PAYMENTS
        // ══════════════════════════════════════════════════════════════════════
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained('appointments')->cascadeOnDelete();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();

            $table->decimal('amount', 10, 2);
            $table->string('currency', 10)->default('PHP');
            $table->enum('payment_method', ['cash', 'gcash', 'paymaya', 'credit_card', 'debit_card', 'bank_transfer'])->default('cash');
            $table->enum('status', ['pending', 'paid', 'failed', 'refunded', 'cancelled'])->default('pending');

            $table->string('transaction_reference', 150)->nullable();
            $table->string('receipt_path')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index('status');
        });

        // ══════════════════════════════════════════════════════════════════════
        // 10. LIVE CHAT — CONVERSATIONS
        // ══════════════════════════════════════════════════════════════════════
        Schema::create('chat_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();

            $table->enum('status', ['open', 'pending', 'closed'])->default('open');
            $table->timestamp('last_message_at')->nullable();

            $table->timestamps();
        });

        // ══════════════════════════════════════════════════════════════════════
        // 11. LIVE CHAT — MESSAGES
        // ══════════════════════════════════════════════════════════════════════
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('chat_conversations')->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();

            $table->text('message')->nullable();
            $table->string('attachment_path')->nullable();
            $table->string('attachment_name')->nullable();

            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();

            $table->timestamps();

            $table->index(['conversation_id', 'created_at']);
        });

        // ══════════════════════════════════════════════════════════════════════
        // 12. ANNOUNCEMENTS
        // ══════════════════════════════════════════════════════════════════════
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->string('title', 255);
            $table->text('body');
            $table->string('image_path')->nullable();
            $table->boolean('is_published')->default(true);
            $table->timestamp('published_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });

        // ══════════════════════════════════════════════════════════════════════
        // 13. NOTIFICATIONS  (in-app + email notification log)
        // ══════════════════════════════════════════════════════════════════════
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('title', 255);
            $table->text('message');

            $table->enum('type', [
                'account_approval',
                'appointment_reminder',
                'appointment_update',
                'appointment_cancellation',
                'health_reminder',
                'payment_update',
                'feedback_response',
                'announcement',
                'general',
            ])->default('general');

            $table->string('notifiable_type')->nullable();
            $table->unsignedBigInteger('notifiable_id')->nullable();

            $table->string('deep_link', 512)->nullable();

            $table->enum('channel', ['app', 'email', 'both'])->default('both');
            $table->boolean('email_sent')->default(false);
            $table->timestamp('email_sent_at')->nullable();

            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['notifiable_type', 'notifiable_id']);
            $table->index(['user_id', 'is_read']);
        });

        // ══════════════════════════════════════════════════════════════════════
        // 14. ACTIVITY LOGS  (system-wide audit trail)
        // ══════════════════════════════════════════════════════════════════════
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 255);
            $table->string('subject_type')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();

            $table->index(['subject_type', 'subject_id']);
            $table->index('action');
        });

        // ══════════════════════════════════════════════════════════════════════
        // 15. LOGIN LOGS
        // ══════════════════════════════════════════════════════════════════════
        Schema::create('login_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('email', 255)->nullable();
            $table->enum('status', ['success', 'failed'])->default('success');
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('logged_in_at')->useCurrent()->useCurrentOnUpdate();
            $table->timestamps();

            $table->index('ip_address');
            $table->index('logged_in_at');
        });

        // ══════════════════════════════════════════════════════════════════════
        // 16. CACHE
        // ══════════════════════════════════════════════════════════════════════
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });

        // ══════════════════════════════════════════════════════════════════════
        // 17. SESSIONS
        // ══════════════════════════════════════════════════════════════════════
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('login_logs');
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_conversations');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('feedbacks');
        Schema::dropIfExists('health_reminders');
        Schema::dropIfExists('pet_medical_records');
        Schema::dropIfExists('appointment_status_logs');
        Schema::dropIfExists('appointments');
        Schema::dropIfExists('pets');
        Schema::dropIfExists('veterinarian_profiles');
        Schema::dropIfExists('users');
    }
};