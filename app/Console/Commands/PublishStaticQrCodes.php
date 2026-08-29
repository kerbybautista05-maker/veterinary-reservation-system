<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Copies the three static QR code images from the project root
 * into storage/app/public/qrcodes/ so they are served via the
 * storage symlink (public/storage/qrcodes/).
 *
 * Usage:
 *   1. Place qrcode-01.jpg, qrcode-02.jpg, qrcode-03.jpg in the
 *      project root (same folder as artisan) or update $sourcePath below.
 *   2. Run: php artisan qr:publish
 *   3. Run: php artisan storage:link  (if not done already)
 */
class PublishStaticQrCodes extends Command
{
    protected $signature   = 'qr:publish';
    protected $description = 'Copy the three static QR code images (qrcode-01/02/03.jpg) into public storage';

    public function handle(): int
    {
        $files = [
            'qrcode-01.jpg',
            'qrcode-02.jpg',
            'qrcode-03.jpg',
        ];

        // Source: adjust this to wherever you store the originals.
        // Default: project root (base_path()).
        $sourceDir = base_path();

        $disk = Storage::disk('public');
        $disk->makeDirectory('qrcodes');

        $published = 0;

        foreach ($files as $filename) {
            $source = $sourceDir . DIRECTORY_SEPARATOR . $filename;

            if (!file_exists($source)) {
                $this->warn("  [SKIP] Not found: {$source}");
                continue;
            }

            $destination = 'qrcodes/' . $filename;
            $disk->put($destination, file_get_contents($source));
            $this->info("  [OK]   Published → storage/app/public/{$destination}");
            $published++;
        }

        if ($published === 0) {
            $this->error('No QR images were published. Place qrcode-01/02/03.jpg in the project root and try again.');
            return self::FAILURE;
        }

        $this->info("\n✔ {$published}/3 QR image(s) published successfully.");
        $this->line("  Run <comment>php artisan storage:link</comment> if you haven't already.");
        return self::SUCCESS;
    }
}
