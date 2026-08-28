import axios from 'axios';
import * as cheerio from 'cheerio';
import {
    savePropertyLinks
} from './scraperRepository.js';
import {
    syncDatabase
} from '../models/index.js';
import {
    fileURLToPath
} from 'url';

import {
    client,
    fetchPageWithRetry
} from './getPages.js'
const currentFilePath = fileURLToPath(
    import.meta.url);


const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildPageUrl = (page) => {
    const base = process.env.rentahouseUrl || 'https://rentahouse.com.ve/buscar-propiedades';
    if (page === 1) return base;
    return `${base}?page=${page}&orderBy=entryTimestamp%20desc`;
};

const extractLinksFromHtml = (htmlString, selector) => {
    const dom = cheerio.load(htmlString);
    const links = [];

    dom(selector).each((_, element) => {
        const href = dom(element).attr('href');
        if (href && !links.includes(href)) {
            links.push(href);
        }
    });

    return links;
};


export const collectAndSaveLinks = async (maxPages, delayMs = 500) => {
    console.log('[Links] Iniciando recolección de links vía HTTP directo...');
    const allLinks = [];

    for (let page = 1; page <= maxPages; page++) {
        const url = buildPageUrl(page);
        console.log(`[Links] Consultando página ${page}: ${url}`);

        try {
            const htmlString = await fetchPageWithRetry(url);
            const pageLinks = extractLinksFromHtml(htmlString, 'div.card-body > a');

            if (pageLinks.length === 0) {
                console.log(`[Links] Página ${page} sin links. Fin de paginación.`);
                break;
            }

            allLinks.push(...pageLinks);
            console.log(`[Links] Página ${page}: ${pageLinks.length} links extraídos`);
        } catch (err) {
            console.error(`[Links] Falló página ${page} después de reintentos: ${err.message}`);
            break;
        }

        if (page < maxPages) {
            await delay(delayMs);
        }
    }

    const uniqueLinks = [...new Set(allLinks)];
    console.log(`[Links] Total recolectados: ${allLinks.length}, Únicos: ${uniqueLinks.length}`);

    const {
        created,
        duplicates,
        failed
    } = await savePropertyLinks(uniqueLinks, 'rentahouse');
    console.log(`[Links] Guardados en DB: ${created} nuevos, ${duplicates} duplicados, ${failed} fallidos`);

    return {
        total: uniqueLinks.length,
        created,
        duplicates,
        failed,
        links: uniqueLinks
    };
};

const isMain = currentFilePath === process.argv[1];

if (isMain) {
    (async () => {
        await syncDatabase();
        await collectAndSaveLinks(200, 500);
    })();
}

export default collectAndSaveLinks;