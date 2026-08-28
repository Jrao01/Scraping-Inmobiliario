const priceTypeMap = {
    'monthly': 'monthly',
    'daily': 'daily',
    'mensual': 'monthly',
    'diario': 'daily',
    'diaria': 'daily',
};

export const normalizePriceType = (raw) => {
    if (!raw) return 'monthly';
    const clean = raw.trim().toLowerCase();
    return priceTypeMap[clean] || 'monthly';
};

export default normalizePriceType;
