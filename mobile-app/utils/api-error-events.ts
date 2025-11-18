export type ApiErrorEvent = {
    status: number;
    message: string;
    response?: unknown;
    path?: string;
    method?: string;
};

type ApiErrorListener = (event: ApiErrorEvent) => void;

const listeners = new Set<ApiErrorListener>();

export function subscribeApiErrors(listener: ApiErrorListener) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function emitApiError(event: ApiErrorEvent) {
    if (!event) return;
    listeners.forEach((listener) => {
        try {
            listener(event);
        } catch (error) {
            console.error('Global API error listener failed', error);
        }
    });
}


