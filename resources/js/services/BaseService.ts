// BaseService.ts
import { ApiResponse } from './types';

interface JsonResponseBody {
    success?: boolean;
    data?: unknown;
    message?: string;
    errors?: Record<string, string[]>;
    pagination?: ApiResponse<unknown>['pagination'];
    code?: string;
    server_time?: string;
    deep_link?: string; // Add deep_link support
}

export class BaseService {
    protected baseURL: string;

    constructor() {
        this.baseURL = typeof window !== 'undefined' ? window.location.origin : '';
    }

    /**
     * Get XSRF token from cookie (Laravel Sanctum's default behavior)
     */
    protected getXsrfToken(): string {
        if (typeof document === 'undefined') return '';
        
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'XSRF-TOKEN') {
                try {
                    return decodeURIComponent(value);
                } catch {
                    return value;
                }
            }
        }
        return '';
    }

    /**
     * Ensure CSRF cookie exists before making requests
     */
    protected async ensureCsrfCookie(): Promise<boolean> {
        if (typeof document === 'undefined') return false;
        
        // Check if we already have a valid XSRF token
        const existingToken = this.getXsrfToken();
        if (existingToken) {
            return true;
        }

        // Fetch new CSRF cookie
        try {
            const response = await fetch(`${this.baseURL}/sanctum/csrf-cookie`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                // Wait for cookie to be set
                await new Promise(resolve => setTimeout(resolve, 100));
                return !!this.getXsrfToken();
            }
        } catch (error) {
            console.error('Failed to fetch CSRF cookie:', error);
        }

        return false;
    }

    protected async request<T>(
        url: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        // Ensure we have a CSRF cookie for state-changing requests
        const isStateChanging = options.method && 
            ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method.toUpperCase());
        
        if (isStateChanging && typeof document !== 'undefined') {
            const hasCsrf = await this.ensureCsrfCookie();
            if (!hasCsrf) {
                console.warn('No CSRF token available for state-changing request');
            }
        }

        const makeRequest = async (retryCount = 0): Promise<Response> => {
            const isFormData = options.body instanceof FormData;
            const xsrfToken = this.getXsrfToken();

            const headers: Record<string, string> = {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': this.baseURL,
            };

            // Add XSRF token for state-changing requests
            if (isStateChanging && xsrfToken) {
                headers['X-XSRF-TOKEN'] = xsrfToken;
            }

            // Set Content-Type for non-FormData requests
            if (!isFormData && options.body) {
                headers['Content-Type'] = 'application/json';
            }

            // Merge with custom headers
            const customHeaders = options.headers as Record<string, string> || {};
            const mergedHeaders = { ...headers, ...customHeaders };

            // Remove Content-Type for FormData (browser will set it)
            if (isFormData) {
                delete mergedHeaders['Content-Type'];
            }

            const config: RequestInit = {
                ...options,
                headers: mergedHeaders,
                credentials: 'include',
                mode: 'cors',
            };

            // Ensure URL is absolute
            const absoluteUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
            return fetch(absoluteUrl, config);
        };

        try {
            let response = await makeRequest();

            // Handle 419 CSRF token mismatch
            if (response.status === 419 && isStateChanging && typeof document !== 'undefined') {
                console.warn('CSRF token mismatch, refreshing and retrying...');
                
                // Refresh CSRF cookie
                await this.ensureCsrfCookie();
                
                // Wait a bit longer for cookie to propagate
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Retry the request once
                const retryResponse = await makeRequest(1);
                
                if (retryResponse.status !== 419) {
                    response = retryResponse;
                } else {
                    return {
                        success: false,
                        message: 'Session expired. Please refresh the page and try again.',
                        errors: {},
                    } as ApiResponse<T>;
                }
            }

            // Handle 204 No Content or non-JSON responses
            const contentType = response.headers.get('content-type');
            if (!contentType?.includes('application/json')) {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return { success: true, data: undefined as T, message: 'OK' };
            }

            const body = await response.json() as JsonResponseBody;

            if (!response.ok) {
                console.error(`[API Error] ${options.method ?? 'GET'} ${url}:`, body);
                return {
                    success: false,
                    message: body.message ?? `HTTP ${response.status}`,
                    errors: body.errors ?? {},
                    ...(body.code ? { code: body.code } : {}),
                    ...(body.server_time ? { server_time: body.server_time } : {}),
                } as ApiResponse<T>;
            }

            // Transform response to consistent format
            const result: ApiResponse<T> = {
                success: body.success !== undefined ? body.success : true,
                data: (body.data ?? body) as T,
                message: body.message ?? 'Success',
            };

            // Add pagination if present
            if (body.pagination) {
                result.pagination = body.pagination;
            }

            // Improved deep_link extraction - handles nested data structures
            if (body.data && typeof body.data === 'object') {
                // Check if data itself has deep_link
                if ('deep_link' in body.data && body.data.deep_link) {
                    (result.data as any).deep_link = body.data.deep_link;
                }
                // Check if data is an array and items have deep_link (for paginated responses)
                else if (Array.isArray(body.data) && body.data.length > 0) {
                    (result.data as any[]).forEach(item => {
                        if (item && typeof item === 'object' && 'deep_link' in item && item.deep_link) {
                            // Keep existing deep_link
                        }
                    });
                }
            }
            
            // Also check for deep_link at root level
            if (body.deep_link) {
                // If result.data is an object, add deep_link to it
                if (result.data && typeof result.data === 'object') {
                    (result.data as any).deep_link = body.deep_link;
                }
            }

            return result;
        } catch (error) {
            console.error('[BaseService] Request failed:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unexpected error occurred',
                errors: {},
            };
        }
    }

    protected buildQueryString(params: Record<string, unknown>): string {
        const sp = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
                // Handle boolean values
                if (typeof value === 'boolean') {
                    sp.append(key, value ? '1' : '0');
                } else if (Array.isArray(value)) {
                    // Handle arrays (e.g., multiple IDs)
                    value.forEach(v => sp.append(`${key}[]`, String(v)));
                } else {
                    sp.append(key, String(value));
                }
            }
        }
        return sp.toString();
    }

    /**
     * GET request helper
     */
    protected async get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
        const queryString = params ? `?${this.buildQueryString(params)}` : '';
        return this.request<T>(`${url}${queryString}`, { method: 'GET' });
    }

    /**
     * POST request helper
     */
    protected async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
        return this.request<T>(url, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    /**
     * POST request helper for FormData
     */
    protected async postFormData<T>(url: string, formData: FormData): Promise<ApiResponse<T>> {
        return this.request<T>(url, {
            method: 'POST',
            body: formData,
        });
    }

    /**
     * PUT request helper
     */
    protected async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
        return this.request<T>(url, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    /**
     * PATCH request helper
     */
    protected async patch<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
        return this.request<T>(url, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    /**
     * DELETE request helper
     */
    protected async delete<T>(url: string): Promise<ApiResponse<T>> {
        return this.request<T>(url, { method: 'DELETE' });
    }
}