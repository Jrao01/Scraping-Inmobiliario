import { ScrapedProperty, ScrapingRun, PropertyLink } from '../models/index.js';
import { Op } from 'sequelize';

export const createRun = async (sourceName) => {
    return await ScrapingRun.create({
        source_name: sourceName,
        started_at: new Date().toISOString(),
    });
};

export const finishRun = async (runId, { itemsFound, itemsOk, itemsError }) => {
    return await ScrapingRun.update(
        {
            finished_at: new Date().toISOString(),
            items_found: itemsFound,
            items_ok: itemsOk,
            items_error: itemsError,
        },
        { where: { id: runId } }
    );
};

export const getAllProperties = async (sourceName) => {
    return await ScrapedProperty.findAll({
        where: { outer_source: sourceName },
        raw: true,
    });
};

export const getUnsyncedProperties = async (sourceName) => {
    return await ScrapedProperty.findAll({
        where: {
            outer_source: sourceName,
            synced_at: null,
        },
        raw: true,
    });
};

export const markAsSynced = async (sourceName) => {
    return await ScrapedProperty.update(
        { synced_at: new Date().toISOString() },
        {
            where: {
                outer_source: sourceName,
                synced_at: null,
            },
        }
    );
};

export const saveScrapedProperties = async (properties, sourceName) => {
    let created = 0;
    let duplicates = 0;
    let failed = 0;

    for (const prop of properties) {
        try {
            const [, wasCreated] = await ScrapedProperty.upsert({
                ...prop,
                outer_source: sourceName,
                scraped_at: new Date().toISOString(),
            });
            wasCreated ? created++ : duplicates++;
        } catch (err) {
            failed++;
            console.error('Error guardando propiedad:', err.message, prop.source_url);
        }
    }

    return { created, duplicates, failed };
};

/* =========================================================
   Property Links
   ========================================================= */

export const savePropertyLinks = async (links, sourceName = 'rentahouse') => {
    let created = 0;
    let duplicates = 0;
    let failed = 0;

    for (const link of links) {
        try {
            const [, wasCreated] = await PropertyLink.upsert({
                link,
                source: sourceName,
                status: 'pending',
                updated_at: new Date().toISOString()
            });
            wasCreated ? created++ : duplicates++;
        } catch (err) {
            failed++;
            console.error('Error guardando link:', err.message, link);
        }
    }

    return { created, duplicates, failed };
};

export const getPendingLinks = async (sourceName = 'rentahouse', limit = null) => {
    const options = {
        where: {
            source: sourceName,
            status: 'pending'
        },
        raw: true
    };
    if (limit) options.limit = limit;
    return await PropertyLink.findAll(options);
};

export const getAllLinks = async (sourceName = 'rentahouse') => {
    return await PropertyLink.findAll({
        where: { source: sourceName },
        raw: true
    });
};

export const markLinkAsScraped = async (linkId) => {
    return await PropertyLink.update(
        {
            status: 'scraped',
            scraped_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        { where: { id: linkId } }
    );
};

export const markLinkAsError = async (linkId) => {
    return await PropertyLink.update(
        {
            status: 'error',
            updated_at: new Date().toISOString()
        },
        { where: { id: linkId } }
    );
};

export const getLinksUpdatedSince = async (sourceName = 'rentahouse', since) => {
    return await PropertyLink.findAll({
        where: {
            source: sourceName,
            updated_at: { [Op.gte]: since }
        },
        raw: true
    });
};
