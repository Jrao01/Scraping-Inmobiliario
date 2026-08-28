import * as cheerio from 'cheerio';
import {
    getPendingLinks,
    markLinkAsScraped,
    markLinkAsError
} from './scraperRepository.js';
import {
    fetchPageWithRetry
} from './getPages.js';
import { normalizeType } from '../utils/normalizeType.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const initRemax = async (limit, delayMs = 500) => {

    const pendingLinks = await getPendingLinks('remax', limit);
    console.log('xxxxxxxxxxxxxxxxxxxx');
    console.log(`Links pendientes: ${pendingLinks.length}`);
    console.log(pendingLinks.map(l => l.link));
    console.log('xxxxxxxxxxxxxxxxxxxx');


    if (pendingLinks.length === 0) {
        console.log('[Remax] No hay links pendientes para procesar.');
        return [];
    }

    const properties = await GetPropertiesDetails(pendingLinks, delayMs);
    console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXX');
    console.log(properties, properties.length);
    console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXX');

    return properties;

}

const GetPropertiesDetails = async (pendingLinks, delayMs) => {
    const properties = [];
    for (const linkObj of pendingLinks) {
        const { id: linkId, link } = linkObj;
        console.log('-----------------EXTRAYENDO PROPIEDAD-----------------')
        console.log('Link:', link)
        console.log('-----------------EXTRAYENDO PROPIEDAD-----------------')

        try {
            const htmlString = await fetchPageWithRetry(link);
            const property = await extractPropertyDetails(htmlString, link, linkId);

            if (property && !properties.find(prop => prop.external_id === property.external_id)) {
                properties.push(property)
                console.log(`[Property] Propiedad extraída nro :`, properties.length);
                await markLinkAsScraped(linkId);
            } else {
                await markLinkAsError(linkId);
            }
        } catch (err) {
            console.error(`[Property] Falló extracción de ${link}: ${err.message}`);
            await markLinkAsError(linkId);
        }

        await delay(delayMs);
    }
    return properties
}

const extractPropertyDetails = async (htmlString, url, propertyLinkId) => {
    const dom = cheerio.load(htmlString);

    const title = dom('h1.titulo-inmueble').text().trim() || null;
    if (!title) {
        console.log('-----------------SKIP PROPERTY-----------------', url)
        return null
    }

    const nombre = dom('h2.nombre-inmueble').text().trim() || null;

    const rawPrice = dom('.precio-ref .fw-bold').text().trim();
    const price = rawPrice
        ? parseFloat(rawPrice.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.')) || 0
        : 0;

    const externalId = dom('.codigo .fw-bold').text().trim() || null;

    const description = dom('.texto-descripcion').text().trim() || null;

    const caracteristicas = dom('.caracteristicas-inmueble').text();
    const bedroomsMatch = caracteristicas.match(/(\d+)\s*hotel/i);
    const bathroomsMatch = caracteristicas.match(/(\d+)\s*bathtub/i);
    const parkingMatch = caracteristicas.match(/(\d+)\s*directions_car/i);
    const areaMatch = caracteristicas.match(/square_foot\s*(\d+)/i);
    const terrainMatch = caracteristicas.match(/flip_to_front\s*(\d+)/i);

    const bedrooms = bedroomsMatch ? parseInt(bedroomsMatch[1]) : 0;
    const bathrooms = bathroomsMatch ? parseInt(bathroomsMatch[1]) : 0;
    const parking = parkingMatch ? parseInt(parkingMatch[1]) : 0;
    const area = areaMatch ? parseInt(areaMatch[1]) : 0;
    const terrainArea = terrainMatch ? parseInt(terrainMatch[1]) : 0;

    const datosItems = dom('.datos-inmueble .lista-datos ul li, .datos-inmueble ul li');
    const datos = {};
    datosItems.each((_, li) => {
        const text = dom(li).text().trim();
        const match = text.match(/^([^:]+):\s*(.+)$/);
        if (match) {
            datos[match[1].trim()] = match[2].trim();
        }
    });

    const type = normalizeType(datos['Tipo']);
    const listingTypeRaw = datos['Inmueble en'] || '';
    const listing_type = listingTypeRaw.toLowerCase().includes('venta') ? 'Venta' : 'Alquiler';

    const state = datos['Estado'] || null;
    const city = datos['Ciudad'] || null;
    const neighborhood = datos['Urbanización'] || null;
    const address = datos['Dirección'] || null;

    let location = 'Desconocido';
    if (neighborhood && state) {
        location = `${neighborhood}, ${state}`;
    } else if (city && state) {
        location = `${city}, ${state}`;
    } else if (city) {
        location = city;
    } else if (state) {
        location = state;
    }

    let lat = null;
    let lng = null;
    const mapComponent = dom('[data-react-component="MapaInmueble"]');
    if (mapComponent.length > 0) {
        try {
            const props = JSON.parse(mapComponent.attr('data-props'));
            if (props.ubicacion) {
                lat = parseFloat(props.ubicacion.latitud) || null;
                lng = parseFloat(props.ubicacion.longitud) || null;
            }
        } catch (e) {}
    }

    const mainImageEl = dom('meta[property="og:image"]');
    const mainImage = mainImageEl.length > 0 ? mainImageEl.attr('content') || null : null;

    const images = [];
    dom('.inmueble-imagen .swiper-slide img').each((_, el) => {
        const src = dom(el).attr('src');
        if (src && !images.includes(src)) {
            images.push(src);
        }
    });

    const keywords = dom('meta[name="keywords"]').attr('content') || '';
    const excludeWords = [
        type, listing_type, neighborhood, city, state, 'VEN', 'REMAX Venezuela',
        'Venta', 'Alquiler'
    ].filter(Boolean).map(w => w.toLowerCase());
    const features = keywords.split(',')
        .map(f => f.trim())
        .filter(f => f && !excludeWords.includes(f.toLowerCase()));

    const ownerName = dom('.nombre-agente').text().trim() || null;
    const ownerPhoto = dom('.contacto-agente .agente-izquierda img').attr('src') || null;

    return {
        outer_source: 'remax',
        source_url: url,
        external_id: externalId,
        title: nombre || title,
        description,
        type,
        listing_type,
        price,
        lat,
        lng,
        owner_name: ownerName,
        owner_photo: ownerPhoto,
        main_image: mainImage,
        images: JSON.stringify(images),
        features: JSON.stringify(features),
        bedrooms,
        bathrooms,
        area,
        furnished: 0,
        neighborhood,
        city,
        state,
        address,
        location,
        property_link_id: propertyLinkId,
    }
}
