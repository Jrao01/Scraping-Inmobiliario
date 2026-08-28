import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ScrapedProperty } from '../models/index.js';
import { syncDatabase } from '../models/index.js';

const currentFilePath = fileURLToPath(import.meta.url);

const escapeCsv = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
};

const generateCsv = async (source, limit) => {
    await syncDatabase();

    const where = {};
    if (source) {
        where.outer_source = source;
        console.log(`[CSV] Filtrando propiedades del source: ${source}`);
    } else {
        console.log('[CSV] Consultando propiedades de la base de datos...');
    }

    const options = { where, raw: true };
    if (limit) {
        options.limit = Number(limit);
        console.log(`[CSV] Limite de propiedades: ${limit}`);
    }

    const properties = await ScrapedProperty.findAll(options);

    if (properties.length === 0) {
        console.log('[CSV] No hay propiedades para exportar.');
        return;
    }

    const headers = [
        'outer_source',
        'source_url',
        'external_id',
        'title',
        'description',
        'type',
        'listing_type',
        'price',
        'price_type',
        'price_rate',
        'owner_name',
        'owner_photo',
        'owner_contact',
        'address',
        'location',
        'neighborhood',
        'city',
        'state',
        'zip_code',
        'lat',
        'lng',
        'bedrooms',
        'bathrooms',
        'area',
        'furnished',
        'features',
        'main_image',
        'images',
        'scraped_at',
    ];

    const rows = properties.map((prop) => {
        return headers.map((header) => escapeCsv(prop[header])).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    const ts = new Date().toISOString().replace(/[-:T.Z]/g, '');
    const sourcePart = source ? `-${source}` : '';
    const fileName = `properties-${ts}${sourcePart}.csv`;
    const staticDir = path.join(process.cwd(), 'static');
    const filePath = path.join(staticDir, fileName);

    if (!fs.existsSync(staticDir)) {
        fs.mkdirSync(staticDir, { recursive: true });
    }

    fs.writeFileSync(filePath, csvContent, 'utf8');

    console.log(`[CSV] Archivo generado: ${filePath}`);
    console.log(`[CSV] Total de propiedades exportadas: ${properties.length}`);
};

const isMain = currentFilePath === process.argv[1];

if (isMain) {
    const sourceArg = process.argv[2];
    const limitArg = process.argv[3];
    generateCsv(sourceArg, limitArg).catch((err) => {
        console.error('[CSV] Error generando CSV:', err.message);
        process.exit(1);
    });
}

export { generateCsv };
