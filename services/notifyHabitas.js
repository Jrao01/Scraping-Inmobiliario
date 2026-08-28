import axios from 'axios';
import { formatForHabitas } from './formatForHabitas.js';

const HABITAS_API_URL = process.env.HABITAS_API_URL;
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

export const sendPropertiesToHabitas = async (properties, sourceName) => {
    if (!HABITAS_API_URL || !SCRAPER_API_KEY) {
        console.warn('[Habitas] Variables de entorno faltantes. No se puede notificar.');
        return null;
    }

    if (!Array.isArray(properties) || properties.length === 0) {
        console.log('[Habitas] No hay propiedades para enviar.');
        return null;
    }

    const formatted = formatForHabitas(properties, sourceName);

    try {
        const response = await axios.post(
            HABITAS_API_URL + '/api/properties/scraper/ingest',
            formatted,
            {
                headers: {
                    'X-Scraper-Key': SCRAPER_API_KEY,
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            }
        );

        console.log('[Habitas] Respuesta ingest: ' + response.status, response.data);
        return response.data;
    } catch (err) {
        console.error('[Habitas] Error enviando propiedades:', err.message);
        if (err.response) {
            console.error('[Habitas] Status:', err.response.status, err.response.data);
        }
        return null;
    }
};

export const reportJobStatusToHabitas = async (jobId, status, summary = null) => {
    if (!HABITAS_API_URL || !SCRAPER_API_KEY) {
        console.warn('[Habitas] Variables de entorno faltantes. No se puede reportar status.');
        return null;
    }

    if (!jobId) {
        console.log('[Habitas] Sin jobId, no se reporta status.');
        return null;
    }

    try {
        const body = { status };
        if (summary) body.summary = summary;

        const response = await axios.post(
            HABITAS_API_URL + '/api/scraper/jobs/' + jobId + '/report',
            body,
            {
                headers: {
                    'X-Scraper-Key': SCRAPER_API_KEY,
                    'Content-Type': 'application/json',
                },
                timeout: 15000,
            }
        );

        console.log('[Habitas] Respuesta report: ' + response.status, response.data);
        return response.data;
    } catch (err) {
        console.error('[Habitas] Error reportando job:', err.message);
        if (err.response) {
            console.error('[Habitas] Status:', err.response.status, err.response.data);
        }
        return null;
    }
};