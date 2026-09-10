/**
 * Retry utility with exponential backoff for reliable API calls
 */

export interface RetryOptions {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    timeoutMs?: number;
    shouldRetry?: (error: any) => boolean;
    onRetry?: (attempt: number, error: any) => void;
}

export class RetryError extends Error {
    constructor(
        message: string,
        public originalError: any,
        public attempts: number
    ) {
        super(message);
        this.name = 'RetryError';
    }
}

export class TimeoutError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TimeoutError';
    }
}

/**
 * Default retry condition: retry on network errors and 5xx status codes
 */
const defaultShouldRetry = (error: any): boolean => {
    // Network errors (fetch failed)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return true;
    }

    // Timeout errors
    if (error.name === 'TimeoutError') {
        return true;
    }

    // HTTP errors
    if (error.status) {
        // Retry on 500, 502, 503, 504 (server errors)
        if (error.status >= 500 && error.status <= 599) {
            return true;
        }
        // Retry on 429 (rate limit)
        if (error.status === 429) {
            return true;
        }
    }

    // Don't retry on 4xx client errors (except 429)
    return false;
};

/**
 * Wraps a fetch call with timeout support
 */
async function fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new TimeoutError(`Request timed out after ${timeoutMs}ms`);
        }
        throw error;
    }
}

/**
 * Retry a fetch request with exponential backoff
 */
export async function retryFetch(
    url: string,
    options: RequestInit = {},
    retryOptions: RetryOptions = {}
): Promise<Response> {
    const {
        maxRetries = 3,
        initialDelayMs = 1000,
        maxDelayMs = 10000,
        timeoutMs = 60000,
        shouldRetry = defaultShouldRetry,
        onRetry,
    } = retryOptions;

    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetchWithTimeout(url, options, timeoutMs);

            // If response is not OK, create an error object with status
            if (!response.ok) {
                const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
                error.status = response.status;
                error.response = response;

                // Check if we should retry
                if (attempt < maxRetries && shouldRetry(error)) {
                    lastError = error;
                    const delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);

                    if (onRetry) {
                        onRetry(attempt + 1, error);
                    }

                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }

                throw error;
            }

            return response;

        } catch (error: any) {
            lastError = error;

            // If this is the last attempt or we shouldn't retry, throw
            if (attempt >= maxRetries || !shouldRetry(error)) {
                throw new RetryError(
                    `Request failed after ${attempt + 1} attempt(s): ${error.message}`,
                    error,
                    attempt + 1
                );
            }

            // Calculate delay with exponential backoff
            const delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);

            if (onRetry) {
                onRetry(attempt + 1, error);
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // This should never be reached, but TypeScript needs it
    throw new RetryError(
        `Request failed after ${maxRetries + 1} attempts`,
        lastError,
        maxRetries + 1
    );
}

/**
 * Get user-friendly error message based on error type
 */
export function getErrorMessage(error: any, locale: 'tr' | 'en' = 'en'): string {
    // Timeout errors
    if (error.name === 'TimeoutError' || error instanceof TimeoutError) {
        return locale === 'tr'
            ? '⏱️ İstek zaman aşımına uğradı. Lütfen tekrar deneyin.'
            : '⏱️ Request timed out. Please try again.';
    }

    // Retry errors
    if (error.name === 'RetryError' || error instanceof RetryError) {
        const originalError = error.originalError || error;

        // Network errors
        if (originalError.message?.includes('fetch')) {
            return locale === 'tr'
                ? '🔌 İnternet bağlantısı sorunu. Lütfen bağlantınızı kontrol edin.'
                : '🔌 Network connection issue. Please check your connection.';
        }

        // Rate limit
        if (originalError.status === 429) {
            return locale === 'tr'
                ? '⏳ Çok fazla istek gönderildi. Lütfen biraz bekleyin.'
                : '⏳ Too many requests. Please wait a moment.';
        }

        // Server errors
        if (originalError.status >= 500) {
            return locale === 'tr'
                ? '🔧 Sunucu şu anda yanıt vermiyor. Lütfen daha sonra tekrar deneyin.'
                : '🔧 Server is not responding. Please try again later.';
        }
    }

    // HTTP errors
    if (error.status) {
        if (error.status === 400) {
            return locale === 'tr'
                ? '❌ Geçersiz istek. Lütfen isteğinizi kontrol edin.'
                : '❌ Invalid request. Please check your input.';
        }
        if (error.status === 422) {
            return locale === 'tr'
                ? '❌ AI isteğinizi anlayamadı. Lütfen daha açık bir şekilde ifade edin.'
                : '❌ AI could not understand your request. Please rephrase it.';
        }
    }

    // Generic error
    return locale === 'tr'
        ? `❌ Bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`
        : `❌ An error occurred: ${error.message || 'Unknown error'}`;
}
