<?php
// app/Events/RaceStateUpdated.php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcasts every Bird Race state change (start, per-tick snapshot,
 * finish, reset) on the public "birdrace" channel so any authenticated
 * teacher on /teacher/game-race receives it live via Pusher.
 *
 * NOTE: this implements ShouldBroadcastNow, not ShouldBroadcast. The
 * plain ShouldBroadcast interface pushes the broadcast onto your queue —
 * fine for most things, but here it means events sit undelivered unless
 * you have `php artisan queue:work` running (or QUEUE_CONNECTION=sync).
 * ShouldBroadcastNow fires synchronously on the request instead, which is
 * what makes the "~100ms" latency in the setup guide actually true.
 */
class RaceStateUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly array $payload)
    {
    }

    public function broadcastOn(): Channel
    {
        // Public channel — no channels.php authorization needed. The
        // /api/birdrace/event route already gates who can publish to it;
        // the channel itself is read-only for anyone listening.
        return new Channel('birdrace');
    }

    public function broadcastAs(): string
    {
        return 'race.event';
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}