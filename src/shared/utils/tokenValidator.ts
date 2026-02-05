/**
 * Utilitário para validação de tokens JWT
 * Verifica se o token é válido e não expirou
 */

interface JWTPayload {
    iss?: string;      // Issuer
    iat?: number;      // Issued At
    exp?: number;      // Expiration Time
    nbf?: number;      // Not Before
    sub?: string;      // Subject
    jti?: string;      // JWT ID
    [key: string]: unknown;
}

/**
 * Decodifica o payload de um token JWT sem validar a assinatura
 * @param token - Token JWT completo
 * @returns Payload decodificado ou null se inválido
 */
export const decodeJWT = (token: string): JWTPayload | null => {
    try {
        // JWT tem 3 partes separadas por ponto: header.payload.signature
        const parts = token.split('.');

        if (parts.length !== 3) {
            console.error('Token JWT inválido: formato incorreto');
            return null;
        }

        // Decodifica o payload (segunda parte)
        const payload = parts[1];
        const decoded = atob(payload);
        const parsed = JSON.parse(decoded);

        return parsed as JWTPayload;
    } catch (error) {
        console.error('Erro ao decodificar JWT:', error);
        return null;
    }
};

/**
 * Valida se um token JWT é válido e não expirou
 * @param token - Token JWT a ser validado
 * @returns true se o token é válido, false caso contrário
 */
export const isTokenValid = (token: string): boolean => {
    if (!token || typeof token !== 'string') {
        console.warn('Token inválido: vazio ou tipo incorreto');
        return false;
    }

    const payload = decodeJWT(token);

    if (!payload) {
        return false;
    }

    const now = Math.floor(Date.now() / 1000); // Timestamp atual em segundos

    // Verifica se o token já expirou (exp - Expiration Time)
    if (payload.exp && payload.exp < now) {
        console.warn('Token expirado', {
            expiradoEm: new Date(payload.exp * 1000).toISOString(),
            agora: new Date(now * 1000).toISOString()
        });
        return false;
    }

    // Verifica se o token ainda não é válido (nbf - Not Before)
    if (payload.nbf && payload.nbf > now) {
        console.warn('Token ainda não é válido', {
            validoAPartirDe: new Date(payload.nbf * 1000).toISOString(),
            agora: new Date(now * 1000).toISOString()
        });
        return false;
    }

    // Token válido
    return true;
};

/**
 * Obtém informações do token JWT
 * @param token - Token JWT
 * @returns Informações do token ou null se inválido
 */
export const getTokenInfo = (token: string): {
    isValid: boolean;
    payload: JWTPayload | null;
    expiresAt: Date | null;
    issuedAt: Date | null;
} => {
    const payload = decodeJWT(token);

    if (!payload) {
        return {
            isValid: false,
            payload: null,
            expiresAt: null,
            issuedAt: null
        };
    }

    return {
        isValid: isTokenValid(token),
        payload,
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
        issuedAt: payload.iat ? new Date(payload.iat * 1000) : null
    };
};
