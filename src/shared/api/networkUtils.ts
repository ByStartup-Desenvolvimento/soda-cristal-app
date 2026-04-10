import axios, { type AxiosError } from 'axios';

/**
 * Indica falha de transporte (sem resposta HTTP), não 401/403/4xx com corpo.
 * Usado para não confundir queda de rede com sessão inválida.
 */
export function isNetworkError(error: unknown): boolean {
    if (error === null || error === undefined) return false;

    if (axios.isAxiosError(error)) {
        const ax = error as AxiosError;
        if (ax.response != null) return false;
        const code = ax.code;
        if (code === 'ERR_NETWORK' || code === 'ECONNABORTED' || code === 'ETIMEDOUT') return true;
        // Sem response costuma ser rede / CORS / servidor inacessível
        return true;
    }

    const maybe = error as { code?: string; message?: string };
    if (maybe.code === 'ERR_NETWORK' || maybe.code === 'ECONNABORTED') return true;
    if (maybe.message === 'Network Error') return true;
    return false;
}
