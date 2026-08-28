import normalizeType from '../utils/normalizeType.js';
import normalizeListingType from '../utils/normalizeListingType.js';
import normalizePriceType from '../utils/normalizePriceType.js';
import normalizePriceRate from '../utils/normalizePriceRate.js';

const safeJsonParse = (value) => {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

export const formatForHabitas = (properties, sourceName) => {
    if (!Array.isArray(properties)) {
        return { sourceName: sourceName || 'unknown', properties: [] };
    }

    const formatted = properties.map((prop) => {
        const features = safeJsonParse(prop.features) || [];
        const images = safeJsonParse(prop.images) || [];

        return {
            sourceUrl: prop.source_url || null,
            title: prop.title || null,
            description: prop.description || null,
            type: normalizeType(prop.type),
            listingType: normalizeListingType(prop.listing_type),
            price: prop.price || 0,
            priceType: normalizePriceType(prop.price_type),
            priceRate: normalizePriceRate(prop.price_rate),
            ownerName: prop.owner_name || null,
            ownerPhoto: prop.owner_photo || null,
            ownerContact: prop.owner_contact || null,
            address: prop.address || null,
            location: prop.location || null,
            neighborhood: prop.neighborhood || null,
            city: prop.city || null,
            state: prop.state || null,
            zipCode: prop.zip_code || null,
            lat: prop.lat || 0,
            lng: prop.lng || 0,
            bedrooms: prop.bedrooms || 0,
            bathrooms: prop.bathrooms || 0,
            area: prop.area || 0,
            furnished: prop.furnished === 1,
            features: Array.isArray(features) ? features : [],
            mainImage: prop.main_image || null,
            images: Array.isArray(images) ? images : [],
        };
    });

    return {
        sourceName: sourceName || 'unknown',
        properties: formatted,
    };
};

export default formatForHabitas;
