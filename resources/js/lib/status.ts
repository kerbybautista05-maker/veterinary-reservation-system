export const STATUS_STYLES: Record<string, string> = {
    pending:   'bg-amber-100 text-amber-700',
    approved:  'bg-green-100 text-green-700',
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    canceled:  'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
};

export function statusClass(status?: string): string {
    return STATUS_STYLES[status?.toLowerCase() ?? ''] ?? 'bg-gray-100 text-gray-700';
}