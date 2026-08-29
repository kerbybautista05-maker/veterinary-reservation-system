<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('branches')->insert([
            [
                'id'         => 1,
                'name'       => 'MN2 Davao Main Branch',
                'code'       => 'DAV-MAIN',
                'address'    => '123 Rizal Ave, Poblacion, Davao City, Davao del Sur',
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id'         => 2,
                'name'       => 'MN2 Cebu Branch',
                'code'       => 'CEB-01',
                'address'    => '456 Colon Street, Cebu City, Cebu',
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id'         => 3,
                'name'       => 'MN2 Manila Branch',
                'code'       => 'MNL-01',
                'address'    => '789 Taft Avenue, Ermita, Manila, Metro Manila',
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }
}
