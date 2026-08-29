<?php

namespace App\Support;

use App\Models\User;

trait ResolvesDashboardRoute
{
    protected function dashboardRouteFor(User $user): string
    {
        return match ($user->role) {
            User::ROLE_ADMIN        => route('admin.dashboard'),
            User::ROLE_VETERINARIAN => route('vet.dashboard'),
            User::ROLE_PET_OWNER    => route('owner.dashboard'),
            default                 => route('home'),
        };
    }
}