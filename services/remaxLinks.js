import {
    fetchPageWithRetry
} from './getPages.js'


import * as cheerio from 'cheerio';




export const getLinksRotatingUrls = async (urls, delayy = 500) => {

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const links = []

    for (const url of urls) {
        const htmlString = await fetchPageWithRetry(url)
        const urlProperties = extractLinksFromRemax(htmlString, 'div.inmueble-info > a:nth-child(1)');
        console.log(`[Links] Página ${url}: ${urlProperties.length} links extraídos`);

        links.push(...urlProperties)
        await delay(delayy);
    }

    return links
}

const extractLinksFromRemax = (htmlString, selector) => {
    const dom = cheerio.load(htmlString);
    const links = [];
    const seenHrefs = new Set()
    dom(selector).each((_, element) => {
        const rawhref = dom(element).attr('href');
        const href = cleanHref(rawhref)

        if (href && !seenHrefs.has(href.base_url)) {
            seenHrefs.add(href.base_url);

            links.push(rawhref);
        }
    });

    return links;
};

const cleanHref = (href) => {
    if (!href) return null;

    let cleanLink = ''

    const rawUrl = href.split('-')
    const propertyId = rawUrl.pop()
    console.log('-----------------PROPERTY ID-----------------')
    console.log(propertyId)
    console.log('-----------------PROPERTY ID-----------------')
    rawUrl.forEach((part, index) => {
        if (index == rawUrl.length - 1) {
            cleanLink += part
        }
        cleanLink += part + '-'
    })


    const separatedLink = {
        base_url: cleanLink,
        id: propertyId
    }


    return separatedLink

};