<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AttendanceSelfieSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('attendance_selfies')->insert([
            [
                'teacher_id'      => 5,
                'attendance_date' => '2025-05-05',
                'selfie_path'     => 'selfies/2025/05/maria_santos_20250505.jpg',
                'is_verified'     => true,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],
            [
                'teacher_id'      => 6,
                'attendance_date' => '2025-05-05',
                'selfie_path'     => 'selfies/2025/05/jose_torres_20250505.jpg',
                'is_verified'     => true,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],
            [
                'teacher_id'      => 7,
                'attendance_date' => '2025-05-05',
                'selfie_path'     => 'selfies/2025/05/clarissa_villanueva_20250505.jpg',
                'is_verified'     => false,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],
        ]);
    }
}
