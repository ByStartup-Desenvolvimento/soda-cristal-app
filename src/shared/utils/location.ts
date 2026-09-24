/**
 * Raio permitido para o check-in, em metros.
 *
 * Era 50m (mar/2026), subiu para 100m (mai/2026) depois do relato de vendedor
 * travado na porta do cliente, e agora vai para 350m: com GPS degradado em
 * área de sinal fraco a distância calculada fica maior que a real.
 */
export const RAIO_CHECKIN_METROS = 350;

/**
 * Decide se o check-in pode ser liberado.
 *
 * Desconta a margem de erro que o próprio aparelho informa: uma leitura com
 * 200m de imprecisão não pode ser tratada como exata. Sem isso, o vendedor na
 * porta do cliente é bloqueado por um erro de medição, não por estar longe.
 */
export function estaDentroDoRaio(
    distanciaMetros: number,
    precisaoMetros: number | null,
): boolean {
    if (!Number.isFinite(distanciaMetros)) return false;
    const margem =
        precisaoMetros !== null &&
            Number.isFinite(precisaoMetros) &&
            precisaoMetros > 0
            ? precisaoMetros
            : 0;
    const distanciaMinima = Math.max(0, distanciaMetros - margem);
    return distanciaMinima <= RAIO_CHECKIN_METROS;
}

export interface LocalizacaoObtida {
    latitude: number;
    longitude: number;
    /** Margem de erro em metros informada pelo aparelho. */
    precisaoMetros: number | null;
    /** True quando veio da última posição conhecida, não de uma leitura nova. */
    usouUltimaPosicaoConhecida: boolean;
}

function pedirPosicao(options: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
}

/**
 * Obtém a localização em duas etapas, tolerante a offline.
 *
 * Sem internet o celular perde o apoio das antenas e do Wi-Fi para se
 * localizar e depende só do satélite, que costuma demorar mais. A tentativa
 * única de leitura nova em 15s (com `maximumAge: 0`, que proibia reaproveitar
 * a última posição) travava o check-in em campo.
 *
 * 1. Leitura nova de alta precisão, com mais tempo de espera.
 * 2. Se ela não vier, a última posição conhecida do aparelho.
 */
export async function obterLocalizacaoTolerante(): Promise<LocalizacaoObtida> {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        throw new Error('GEOLOCALIZACAO_NAO_SUPORTADA');
    }

    const montar = (
        position: GeolocationPosition,
        usouUltimaPosicaoConhecida: boolean,
    ): LocalizacaoObtida => ({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        precisaoMetros: Number.isFinite(position.coords.accuracy)
            ? position.coords.accuracy
            : null,
        usouUltimaPosicaoConhecida,
    });

    try {
        return montar(
            await pedirPosicao({
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 0,
            }),
            false,
        );
    } catch (error) {
        console.warn('GPS de alta precisão não respondeu a tempo:', error);
    }

    // Aceita a última posição conhecida (até 5 min) em vez de bloquear.
    return montar(
        await pedirPosicao({
            enableHighAccuracy: false,
            timeout: 20000,
            maximumAge: 5 * 60 * 1000,
        }),
        true,
    );
}

/**
 * Calcula a distância entre dois pontos geográficos em metros usando a fórmula de Haversine
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371000; // Raio da Terra em metros
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance; // Retorno em metros
}
