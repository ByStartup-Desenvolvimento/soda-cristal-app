/**
 * Modelo de Meio de Pagamento conforme retornado pela API
 * GET /meiospagamento/{distribuidorId}
 */
export interface MeioPagamento {
    id: number;
    descricao: string;
    // A API pode retornar outros campos, mas minimamente terá id e descricao
}
