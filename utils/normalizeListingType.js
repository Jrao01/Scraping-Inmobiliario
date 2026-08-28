const listingMap = {
    'Alquiler': 'Alquiler',
    'Venta': 'Venta',
    'Arriendo': 'Alquiler',
    'Rent': 'Alquiler',
    'Sale': 'Venta',
};

export const normalizeListingType = (raw) => {
    if (!raw) return 'Alquiler';
    const clean = raw.trim();
    return listingMap[clean] || 'Alquiler';
};

export default normalizeListingType;
