import axios, { type AxiosError } from 'axios';

/**
 * Abort intencional via AbortController (ERR_CANCELED).
 * Deve ser tratado silenciosamente — não exibir banner offline nem erro.
 */
export function isAbortError(error: unknown): boolean {
    if (axios.isCancel(error)) return true;
    if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') return true;
    if (error instanceof DOMException && error.name === 'AbortError') return true;
    return false;
}

/**
 * Indica falha de transporte (sem resposta HTTP), não 401/403/4xx com corpo.
 * Exclui aborts intencionais para não confundir com queda de rede.
 */
export function isNetworkError(error: unknown): boolean {
    if (error === null || error === undefined) return false;
    if (isAbortError(error)) return false;

    if (axios.isAxiosError(error)) {
        const ax = error as AxiosError;
        if (ax.response != null) return false;
        const code = ax.code;
        if (code === 'ERR_NETWORK' || code === 'ECONNABORTED' || code === 'ETIMEDOUT') return true;
        return true;
    }

    const maybe = error as { code?: string; message?: string };
    if (maybe.code === 'ERR_NETWORK' || maybe.code === 'ECONNABORTED') return true;
    if (maybe.message === 'Network Error') return true;
    return false;
}
