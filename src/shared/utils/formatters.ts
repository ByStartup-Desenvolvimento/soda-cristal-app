
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

export const formatCPFCNPJ = (value?: string | number): string => {
    if (!value) return '';
    const cleanValue = value.toString().replace(/\D/g, '');

    if (cleanValue.length <= 11) {
        return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

export const formatCEP = (value?: string | number): string => {
    if (!value) return '';
    const cleanValue = value.toString().replace(/\D/g, '');
    return cleanValue.replace(/(\d{5})(\d{3})/, '$1-$2');
};

/**
 * Formata data para o padrão exigido pela API Soda Cristal: dd/MM/yyyy HH:mm:ss
 */
export const formatApiDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

