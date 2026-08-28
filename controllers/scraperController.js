import {
    collectAndSaveLinks
} from '../services/rentaHouseLinks.js';
import {
    initRentaHouse
} from '../services/rentaHouse.js';
import {
    createRun,
    finishRun,
    saveScrapedProperties,
    getAllProperties,
    getUnsyncedProperties,
    markAsSynced,
} from '../services/scraperRepository.js';
import {
    formatForHabitas
} from '../services/formatForHabitas.js';
import {
    sendPropertiesToHabitas,
    reportJobStatusToHabitas
} from '../services/notifyHabitas.js';

export const scrapeRequest = async (req, res) => {
    try {
        const {
            source,
            full
        } = req.body || {};
        const run = await createRun(source || 'rentahouse');

        res.status(202).json({
            message: 'Scraping aceptado y en progreso',
            jobId: run.id,
            source: source || 'rentahouse',
            full: !!full,
        });

        // Procesar en background sin bloquear la respuesta
        const clicks = parseInt(process.env.DEFAULT_SCRAPER_CLICKS, 10) || 5;

        // Fase 1: Recolectar links
        await collectAndSaveLinks(clicks);

        // Fase 2: Procesar propiedades
        const properties = await initRentaHouse(clicks);
        const {
            created,
            duplicates,
            failed
        } = await saveScrapedProperties(
            properties,
            source || 'rentahouse'
        );
        await finishRun(run.id, {
            itemsFound: properties.length,
            itemsOk: created,
            itemsError: failed,
        });

        console.log(
            `Job ${run.id} completado: ${created} nuevas, ${duplicates} dup, ${failed} err`
        );

        // Webhook: notificar a Habitas los datos recolectados
        const sourceName = source || 'rentahouse';
        await sendPropertiesToHabitas(properties, sourceName);
        await reportJobStatusToHabitas(run.id, 'completado', {
            created,
            duplicatesSkipped: duplicates,
            failed,
        });
    } catch (err) {
        console.error('Error en scrapeRequest:', err);
        // No se puede responder porque ya enviamos 202
        if (run && run.id) {
            await reportJobStatusToHabitas(run.id, 'fallido', {
                error: err.message,
            });
        }
    }
};

export const scrapeRentaHouse = async (req, res) => {
    try {
        const {
            rawamount
        } = req.body || {};
        const amount = parseInt(rawamount, 10);

        if (!amount || amount <= 0) {
            return res.status(400).json({
                error: 'Debes enviar un número válido de propiedades a recolectar (ej. { "rawamount": 5 })',
            });
        }

        const run = await createRun('rentahouse');

        // Fase 1: Procesar propiedades
        const properties = await initRentaHouse(amount, 500);
        const {
            created,
            duplicates,
            failed
        } = await saveScrapedProperties(
            properties,
            'rentahouse'
        );
        await finishRun(run.id, {
            itemsFound: properties.length,
            itemsOk: created,
            itemsError: failed,
        });

        // Webhook: notificar a Habitas los datos recolectados
        await sendPropertiesToHabitas(properties, 'rentahouse');
        await reportJobStatusToHabitas(run.id, 'completado', {
            created,
            duplicatesSkipped: duplicates,
            failed,
        });

        res.json({
            success: true,
            jobId: run.id,
            totalFound: properties.length,
            created,
            duplicates,
            failed,
        });
    } catch (err) {
        console.error('Error en scrapeRentaHouse:', err);
        if (run && run.id) {
            await reportJobStatusToHabitas(run.id, 'fallido', {
                error: err.message,
            });
        }
        res.status(500).json({
            error: err.message
        });
    }
};

export const ingestProperties = async (req, res) => {
    try {
        const {
            source,
            full
        } = req.body || {};
        const sourceName = source || 'rentahouse';

        const properties = full ?
            await getAllProperties(sourceName) :
            await getUnsyncedProperties(sourceName);

        const formatted = formatForHabitas(properties, sourceName);

        // Marcar como synced solo si no es full (es decir, solo las novedades)
        if (!full) {
            await markAsSynced(sourceName);
        }

        res.json({
            success: true,
            total: formatted.properties.length,
            data: formatted,
        });
    } catch (err) {
        console.error('Error en ingestProperties:', err);
        res.status(500).json({
            error: err.message
        });
    }
};