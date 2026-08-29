<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TeacherProfileSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('teacher_profiles')->insert([
            // Maria Santos → Davao Main, Elite Vanguard, Rank 1
            [
                'user_id'              => 5,
                'branch_id'            => 1,
                'nbi_clearance_path'   => 'documents/nbi/maria_santos_nbi.pdf',
                'tesol_certificate_path' => 'documents/tesol/maria_santos_tesol.pdf',
                'other_documents_path' => null,
                'is_elite_vanguard'    => true,
                'ranking_position'     => 1,
                'created_at'           => $now,
                'updated_at'           => $now,
            ],
            // Jose Torres → Cebu, Rank 2
            [
                'user_id'              => 6,
                'branch_id'            => 2,
                'nbi_clearance_path'   => 'documents/nbi/jose_torres_nbi.pdf',
                'tesol_certificate_path' => 'documents/tesol/jose_torres_tesol.pdf',
                'other_documents_path' => null,
                'is_elite_vanguard'    => false,
                'ranking_position'     => 2,
                'created_at'           => $now,
                'updated_at'           => $now,
            ],
            // Clarissa Villanueva → Manila, Rank 3
            [
                'user_id'              => 7,
                'branch_id'            => 3,
                'nbi_clearance_path'   => 'documents/nbi/clarissa_villanueva_nbi.pdf',
                'tesol_certificate_path' => null,
                'other_documents_path' => 'documents/other/clarissa_villanueva_docs.pdf',
                'is_elite_vanguard'    => false,
                'ranking_position'     => 3,
                'created_at'           => $now,
                'updated_at'           => $now,
            ],
        ]);
    }
}
