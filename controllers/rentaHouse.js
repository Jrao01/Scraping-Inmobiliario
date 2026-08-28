import {
    initRentaHouse
} from "../services/rentaHouse.js";

import {
    collectAndSaveLinks
} from '../services/rentaHouseLinks.js';

import {
    createRun,
    finishRun,
} from '../services/scraperRepository.js';

import {
    reportJobStatusToHabitas
} from '../services/notifyHabitas.js';

export const rentaHouseController = async (req, res, next) => {
    try {
        const properties = await initRentaHouse();
        res.json(properties);
    } catch (error) {
        next(error);
    }
}

export const rentALinks = async (req, res) => {

    const {
        rawamount
    } = req.body || {};
    const amount = parseInt(rawamount, 10);

    if (!amount || amount <= 0) {
        return res.status(400).json({
            error: 'Debes enviar un número válido de clicks/páginas (ej. { "rawamount": 5 })',
        });
    }

    try {
        const links = await collectAndSaveLinks(amount, 500);

        // Webhook: notificar stats de links recolectados
        const run = await createRun('rentahouse-links');
        await reportJobStatusToHabitas(run.id, 'completado', {
            linksCollected: links.total,
            created: links.created,
            duplicatesSkipped: links.duplicates,
            failed: links.failed,
        });
        await finishRun(run.id, {
            itemsFound: links.total,
            itemsOk: links.created,
            itemsError: links.failed,
        });

        res.json({
            success: true,
            message: 'Links recolectados y guardados exitosamente',
            ...links,
        });
    } catch (error) {
        res.status(500).json({
            error: 'Error al recolectar links',
            message: error.message,
        });
    }
};