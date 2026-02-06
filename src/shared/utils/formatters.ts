
export const formatPhone = (phone?: number | string): string => {
    if (!phone) return '-';
    const value = phone.toString().replace(/\D/g, '');

    if (value.length === 11) {
        return value.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (value.length === 10) {
        return value.replace(/^(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return value;
};

export const formatAddress = (
    rua?: string,
    numero?: number,
    bairro?: string
): string => {
    const parts = [
        rua,
        numero ? `${numero}` : null,
        bairro ? `- ${bairro}` : null
    ].filter(Boolean);

    return parts.join(', ');
};

export const mapStatusToLabel = (ativo?: number): 'ativo' | 'inativo' => {
    return ativo === 1 ? 'ativo' : 'inativo';
};
