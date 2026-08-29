<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class VeterinaryAdminSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('users')->updateOrInsert(
            ['email' => 'admin@veterinary.com'],
            [
                'last_name' => 'Admin',
                'first_name' => 'Veterinary',
                'middle_name' => null,
                'suffix' => null,
                'profile_photo_path' => null,
                'email' => 'admin@veterinary.com',
                'phone_number' => null,
                'address' => null,
                'password' => Hash::make('Admin@1234'),
                'role' => 'admin',
                'approval_status' => 'approved',
                'approved_by' => null,
                'approved_at' => $now,
                'rejection_reason' => null,
                'is_active' => true,
                'email_verified_at' => $now,
                'remember_token' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );
    }
}