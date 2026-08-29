/**
 * useNotificationNavigation
 *
 * Drop this hook into ANY notification component (dropdown, full page, etc.)
 * When a teacher clicks a notification that has a deep_link, this hook:
 *
 *   1. Marks the notification as read (via API)
 *   2. Navigates to the deep_link URL
 *
 * The deep_link format is:
 *   /teacher/contracts?doc=123&comment=456   → opens contracts list, auto-opens
 *                                               comment modal for doc 123, highlights comment 456
 *   /teacher/contracts/789                   → opens contract show page
 *   /teacher/contracts                       → opens contract list
 *
 * Usage:
 *   const { navigateToNotification } = useNotificationNavigation();
 *   <button onClick={() => navigateToNotification(notification)}>…</button>
 */

import { useCallback } from 'react';
import { router } from '@inertiajs/react';

export interface NavigableNotification {
    id: number;
    deep_link?: string | null;
    is_read: boolean;
    type?: string;
    notifiable_type?: string | null;
    notifiable_id?: number | null;
}

interface UseNotificationNavigationOptions {
    /** Called after navigation starts (useful to close a dropdown) */
    onNavigate?: () => void;
}

export function useNotificationNavigation(options: UseNotificationNavigationOptions = {}) {
    const { onNavigate } = options;

    const markAsRead = useCallback(async (notificationId: number) => {
        try {
            await fetch(`/api/notifications/${notificationId}/mark-read`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name=csrf-token]') as HTMLMetaElement)?.content ?? '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
        } catch {
            // Non-fatal — continue navigation regardless
        }
    }, []);

    const navigateToNotification = useCallback(async (notification: NavigableNotification) => {
        // Mark as read first (fire-and-forget)
        if (!notification.is_read) {
            markAsRead(notification.id);
        }

        // Determine destination URL
        const deepLink = notification.deep_link;

        if (!deepLink) {
            // No deep link — fall back to the notification type's default page
            const fallback = getFallbackRoute(notification);
            onNavigate?.();
            router.visit(fallback);
            return;
        }

        onNavigate?.();

        // Use Inertia for same-app navigation
        // deep_link is always a path like /teacher/contracts?doc=123&comment=456
        // We need to preserve the query string so the page's deep-link handler fires
        router.visit(deepLink, {
            preserveScroll: false,
            preserveState:  false,
        });
    }, [markAsRead, onNavigate]);

    return { navigateToNotification, markAsRead };
}

/**
 * Fallback routes for notifications without a deep_link.
 * (Older notifications created before the deep_link column existed.)
 */
function getFallbackRoute(notification: NavigableNotification): string {
    const type = notification.type ?? '';
    const notifiableType = notification.notifiable_type ?? '';

    // Contract-related
    if (type === 'contract_alert' || notifiableType.includes('Contract')) {
        if (notification.notifiable_id) {
            // If it's a document notification, go to contracts list (no contract ID known)
            if (notifiableType.includes('ContractDocument')) {
                return '/teacher/contracts';
            }
            return `/teacher/contracts/${notification.notifiable_id}`;
        }
        return '/teacher/contracts';
    }

    // Comment-related
    if (notifiableType.includes('ContractDocumentComment')) {
        return '/teacher/contracts';
    }

    // Leave requests
    if (type === 'request_update' || type === 'approval_notification') {
        return '/teacher/requests';
    }

    // Refunds
    if (type === 'refund_update') {
        return '/teacher/refunds';
    }

    // Announcements
    if (type === 'announcement') {
        return '/teacher/announcements';
    }

    // Performance
    if (type === 'performance_alert' || type === 'warning_notification') {
        return '/teacher/performance';
    }

    return '/teacher/dashboard';
}
