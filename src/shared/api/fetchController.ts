/**
 * Controla AbortController compartilhado para chamadas de dados (não-login).
 *
 * Fluxo:
 *  1. Login detectado → abortDataFetching() cancela todas as chamadas em voo
 *  2. Login com sucesso → resetDataController() cria novo controller
 *  3. Chamadas de dados → getDataSignal() retorna o signal ativo
 */

let dataController = new AbortController();

export function abortDataFetching(): void {
    dataController.abort();
}

export function resetDataController(): void {
    dataController = new AbortController();
}

export function getDataSignal(): AbortSignal {
    return dataController.signal;
}
