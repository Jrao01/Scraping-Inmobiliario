const priceRateMap = {
    'paralelo': 'paralelo',
    'oficial': 'oficial',
    'usd': 'paralelo',
    'bs': 'oficial',
    'bolivar': 'oficial',
    'bolívar': 'oficial',
};

export const normalizePriceRate = (raw) => {
    if (!raw) return 'paralelo';
    const clean = raw.trim().toLowerCase();
    return priceRateMap[clean] || 'paralelo';
};

export default normalizePriceRate;
