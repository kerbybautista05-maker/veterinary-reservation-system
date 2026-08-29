<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pet_medical_records', function (Blueprint $table) {
            $table->string('service_type', 150)->nullable()->after('appointment_id');
        });
    }

    public function down(): void
    {
        Schema::table('pet_medical_records', function (Blueprint $table) {
            $table->dropColumn('service_type');
        });
    }
};
