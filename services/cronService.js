import { CronJob } from 'cron';
import { collectAndSaveLinks } from './rentaHouseLinks.js';
import { initRentaHouse } from './rentaHouse.js';
import { saveScrapedProperties, getLinksUpdatedSince } from './scraperRepository.js';

const DEFAULT_SCHEDULE = process.env.CRON_SCHEDULE || '0 */6 * * *';
const LINK_PAGES = 20;

let job = null;

export const startCron = () => {
    if (job) {
        console.log('Cron ya iniciado, omitiendo...');
        return;
    }

    job = new CronJob(DEFAULT_SCHEDULE, async () => {
        console.log(`[${new Date().toISOString()}] Cron iniciando...`);
        try {
            // FASE 1: Recolectar links de las primeras 20 páginas
            console.log(`[Cron] FASE 1: Recolectando links de ${LINK_PAGES} páginas...`);
            const linkResult = await collectAndSaveLinks(LINK_PAGES, 500);
            console.log(`[Cron] FASE 1 completada: ${linkResult.total} links, ${linkResult.created} nuevos`);

            // FASE 2: Scrapear detalles de links actualizados en la última hora
            const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            const recentLinks = await getLinksUpdatedSince('rentahouse', since);
            console.log(`[Cron] FASE 2: ${recentLinks.length} links actualizados en la última hora`);

            if (recentLinks.length > 0) {
                const properties = await initRentaHouse(recentLinks, 500);
                const { created, duplicates, failed } = await saveScrapedProperties(properties, 'rentahouse');
                console.log(`[Cron] FASE 2 completada: ${created} nuevas, ${duplicates} dup, ${failed} err`);
            } else {
                console.log('[Cron] FASE 2: No hay links recientes para procesar');
            }

            console.log(`[${new Date().toISOString()}] Cron completado.`);
        } catch (err) {
            console.error(`[${new Date().toISOString()}] Error en cron:`, err.message);
        }
    });

    job.start();
    console.log(`Cron iniciado con schedule: ${DEFAULT_SCHEDULE}`);
};

export const stopCron = () => {
    if (job) {
        job.stop();
        job = null;
        console.log('Cron detenido.');
    }
};

export default { startCron, stopCron };
