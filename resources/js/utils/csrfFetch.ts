// utils/csrfFetch.ts

export const csrfGet = async (url: string, options?: RequestInit) => {
    const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...options?.headers,
        },
    });
    
    return response;
};

export const csrfPost = async (url: string, data?: any, options?: RequestInit) => {
    const isFormData = data instanceof FormData;
    
    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };
    
    // Add CSRF token from cookie
    const xsrfToken = getCookie('XSRF-TOKEN');
    if (xsrfToken) {
        headers['X-XSRF-TOKEN'] = xsrfToken;
    }
    
    if (!isFormData && data) {
        headers['Content-Type'] = 'application/json';
    }
    
    const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: isFormData ? data : JSON.stringify(data),
        ...options,
    });
    
    return response;
};

// Helper function to get cookie
function getCookie(name: string): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name) {
            return decodeURIComponent(value);
        }
    }
    return null;
}