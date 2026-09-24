<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop Credit Card / Debit Card from the accepted payment methods enum.
        Schema::table('payments', function (Blueprint $table) {
            $table->enum('payment_method', ['cash', 'gcash', 'paymaya', 'bank_transfer'])->default('cash')->change();
        });

        // Rename the reference column so Pet Owners submit a "Payment Reference".
        // Existing rows keep their values (no data loss).
        Schema::table('payments', function (Blueprint $table) {
            $table->renameColumn('transaction_reference', 'payment_reference');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->renameColumn('payment_reference', 'transaction_reference');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->enum('payment_method', ['cash', 'gcash', 'paymaya', 'credit_card', 'debit_card', 'bank_transfer'])->default('cash')->change();
        });
    }
};