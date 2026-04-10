interface JWTPayload {
    iss?: string;
    iat?: number;
    exp?: number;
    nbf?: number;
    sub?: string;
    jti?: string;
    [key: string]: unknown;
}

function decodeBase64Url(base64Url: string): string {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    const padding = base64.length % 4;
    if (padding) base64 += '='.repeat(4 - padding);

    const binaryStr = atob(base64);

    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }

    return new TextDecoder().decode(bytes);
}

export function decodeJWT(token: string): JWTPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const decoded = decodeBase64Url(parts[1]);
        return JSON.parse(decoded) as JWTPayload;
    } catch {
        return null;
    }
}

/**
 * Verifica formato do token e campos temporais (exp/nbf).
 * Retorna true se o token é estruturalmente válido.
 * A autoridade real sobre validade é o backend (401).
 */
export function isTokenValid(token: string): boolean {
    if (!token || typeof token !== 'string') return false;

    const payload = decodeJWT(token);
    if (!payload) return false;

    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
        console.warn('Token com exp expirado (client-side)', {
            expiradoEm: new Date(payload.exp * 1000).toISOString(),
            agora: new Date(now * 1000).toISOString()
        });
    }

    if (payload.nbf && payload.nbf > now) {
        console.warn('Token com nbf futuro (client-side)', {
            validoAPartirDe: new Date(payload.nbf * 1000).toISOString(),
            agora: new Date(now * 1000).toISOString()
        });
    }

    return true;
}

export function getTokenInfo(token: string): {
    isValid: boolean;
    payload: JWTPayload | null;
    expiresAt: Date | null;
    issuedAt: Date | null;
} {
    const payload = decodeJWT(token);

    if (!payload) {
        return { isValid: false, payload: null, expiresAt: null, issuedAt: null };
    }

    return {
        isValid: isTokenValid(token),
        payload,
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
        issuedAt: payload.iat ? new Date(payload.iat * 1000) : null
    };
}
