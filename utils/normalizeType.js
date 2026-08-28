const typeMap = {
    'Residencia': 'Residencia',
    'Apartamento': 'Apartamento',
    'Apartamentos': 'Apartamento',
    'Casa': 'Casa',
    'Casas': 'Casa',
    'Townhouse': 'Casa',
    'Townhouses': 'Casa',
    'Quinta': 'Residencia',
    'Finca': 'Finca',
    'Local': 'Local',
    'Locales': 'Local',
    'Terreno': 'Terreno',
    'Terrenos': 'Terreno',
    'Hotel': 'Hotel',
    'Habitacion': 'Hotel',
    'Habitación': 'Hotel',
    'Cuarto': 'Hotel',
    'Consultorio Médico': 'Local',
    'Consultorio Odontologico': 'Local',
    'Oficina': 'Local',
    'Local Comercial': 'Local',
    'Galpón': 'Local',
    'Bodega': 'Local',
    'Edificio': 'Local',
};

export const normalizeType = (raw) => {
    if (!raw) return 'Apartamento';
    const clean = raw.trim();
    return typeMap[clean] || 'Apartamento';
};

export default normalizeType;
