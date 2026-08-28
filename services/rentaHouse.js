import axios from 'axios';
import * as cheerio from 'cheerio';
import {
    getPendingLinks,
    markLinkAsScraped,
    markLinkAsError
} from './scraperRepository.js';
import {
    fileURLToPath
} from 'url';

import {
    fetchPageWithRetry,
    client
} from './getPages.js';

const currentFilePath = fileURLToPath(
    import.meta.url);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));



export const initRentaHouse = async (limitOrLinks, delayMs = 500) => {
    let linksToProcess;

    if (Array.isArray(limitOrLinks)) {
        linksToProcess = limitOrLinks;
    } else {
        linksToProcess = await getPendingLinks('rentahouse', limitOrLinks);
    }

    console.log('xxxxxxxxxxxxxxxxxxxx');
    console.log(`Links a procesar: ${linksToProcess.length}`);
    console.log(linksToProcess.map(l => l.link));
    console.log('xxxxxxxxxxxxxxxxxxxx');

    if (linksToProcess.length === 0) {
        console.log('[RentaHouse] No hay links para procesar.');
        return [];
    }

    const properties = await GetPropertiesDetails(linksToProcess, delayMs);
    console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXX');
    console.log(properties, properties.length);
    console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXX');

    return properties;
}

const GetPropertiesDetails = async (pendingLinks, delayMs) => {
    const properties = [];
    for (const linkObj of pendingLinks) {
        const {
            id: linkId,
            link
        } = linkObj;
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

    // Verificar si es propiedad no encontrada
    const titleText = dom('h1').text().trim().toLowerCase();
    if (titleText.includes('propiedad no encontrada')) {
        console.log('-----------------SKIP PROPERTY-----------------', url)
        return null
    }

    const buildProps = (selector) => {
        const props = {}
        dom(selector).each((_, li) => {
            const rawLabel = dom(li).find('.float-left').text() ? dom(li).find('.float-left').text().trim() : null
            const label = rawLabel ? rawLabel.replace(/:$/, '') : null
            const value = dom(li).find('.float-right').text() ? dom(li).find('.float-right').text().trim() : null
            if (label && value) props[label] = value
        })
        return props
    }

    const props = buildProps('.property-detailes-list li')
    const propsMin = buildProps('.property-detailes-list-min li')

    console.log('-----------------PROPS-----------------')
    console.log(props)
    console.log('-----------------PROPS-----------------')

    const mapsLink = dom('a[href*="maps.google.com/maps?ll="]').attr('href')
    const match = mapsLink ? mapsLink.match(/ll=([-\d.]+),([-\d.]+)/) : null

    let lat = match ? match[1] : null
    let lng = match ? match[2] : null

    if (!lat || !lng) {
        const mapDiv = dom('#map')
        lat = mapDiv.length > 0 ? mapDiv.attr('data-latitude') || null : null
        lng = mapDiv.length > 0 ? mapDiv.attr('data-longitude') || null : null
    }

    const mainImageEl = dom('meta[property="og:image"]')

    const slideImages = dom('.swiper-slide img[data-srcset], .swiper-slide img[srcset]')
        .map((_, el) => {
            const srcset = dom(el).attr('data-srcset') || dom(el).attr('srcset') || '';
            return srcset.split(',')[0].trim().split(' ')[0];
        })
        .get()
        .filter(Boolean);

    const images = [...new Set(slideImages)];

    const features = dom('.detalles ul li')
        .map((_, el) => dom(el).text().trim())
        .get()
        .filter((text) => text.startsWith('✅'))
        .map((text) => text.replace('✅', '').trim())

    const rawPrice = dom('.price strong').text().trim()
    const price = rawPrice ? parseFloat(rawPrice.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.')) || 0 : 0;

    const propertyDetails = {
        title: dom('h1').text().trim() || null,
        description: dom('.propertyDescription p').text().trim() || null,
        price,
        lat,
        lng,
        ownerName: dom('.agent-card h2[itemprop="name"]').text().trim() || null,
        mainImage: mainImageEl.length > 0 ? mainImageEl.attr('content') || null : null,
        images,
        features,
        type: props['Tipo de Propiedad'] || null,
        bedrooms: props['Dormitorios'] || null,
        fullBathrooms: parseInt(props['Baños Completos']) || 0,
        halfBathrooms: parseInt(props['Medios Baños']) || 0,
        area: props['Área Privada'] || null,
        furnished: props['Amoblado'] || null,
        externalId: props['Código RAH'] || null,
        neighborhood: propsMin['Urbanización'] || null,
        city: propsMin['Ciudad'] || null,
        state: propsMin['Estado'] || null,
    }

    const titleLower = (propertyDetails.title || '').toLowerCase();
    let listing_type = 'Alquiler';
    if (titleLower.includes('venta')) {
        listing_type = 'Venta';
    } else if (titleLower.includes('alquiler')) {
        listing_type = 'Alquiler';
    }

    const neighborhood = propertyDetails.neighborhood;
    const city = propertyDetails.city;
    const state = propertyDetails.state;
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

    const furnishedVal = propertyDetails.furnished;
    const furnished = (furnishedVal === 'Si' || furnishedVal === 'Sí' || furnishedVal === '1' || furnishedVal === true) ? 1 : 0;

    return {
        outer_source: 'rentahouse',
        source_url: url,
        external_id: propertyDetails.externalId,
        title: propertyDetails.title,
        description: propertyDetails.description,
        type: propertyDetails.type,
        listing_type,
        price: propertyDetails.price,
        lat: propertyDetails.lat ? parseFloat(propertyDetails.lat) : null,
        lng: propertyDetails.lng ? parseFloat(propertyDetails.lng) : null,
        owner_name: propertyDetails.ownerName,
        main_image: propertyDetails.mainImage,
        images: JSON.stringify(propertyDetails.images || []),
        features: JSON.stringify(propertyDetails.features || []),
        bedrooms: propertyDetails.bedrooms ? parseInt(propertyDetails.bedrooms) : 0,
        bathrooms: (propertyDetails.fullBathrooms || 0) + (propertyDetails.halfBathrooms || 0),
        area: propertyDetails.area ? parseFloat(propertyDetails.area.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.')) || 0 : 0,
        furnished,
        neighborhood,
        city,
        state,
        location,
        property_link_id: propertyLinkId,
    }
}


const isMain = currentFilePath === process.argv[1];

if (isMain) {
    initRentaHouse(980)
}


export default initRentaHouse;