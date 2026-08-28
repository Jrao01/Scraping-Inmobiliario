import {
    getLinksRotatingUrls
} from "../services/remaxLinks.js";

import {
    savePropertyLinks,
    saveScrapedProperties,
    createRun,
    finishRun,
} from '../services/scraperRepository.js'

import {
    initRemax
} from '../services/remax.js'

import {
    sendPropertiesToHabitas,
    reportJobStatusToHabitas
} from '../services/notifyHabitas.js';

export const getRemaxLinks = async (req, res) => {

    const AllUrls = [
        'https://www.remax.com.ve/inmuebles/consultorio-medico/alquiler?ubi=Maracay%2C+Aragua%2C+VEN&latitud=10.249081295399&longitud=-67.595835346835',
        'https://www.remax.com.ve/inmuebles/consultorio-medico/alquiler?ubi=Valencia%2C+Carabobo%2C+VEN&latitud=10.253434595029&longitud=-68.011922869535',
        'https://www.remax.com.ve/inmuebles/consultorio-medico/alquiler?ubi=Caracas%2C+Baruta%2C+Miranda%2C+VEN&latitud=10.470254658218&longitud=-66.855035446932',
        'https://www.remax.com.ve/inmuebles/consultorio-medico/alquiler?ubi=Caracas%2C+Chacao%2C+Miranda%2C+VEN&latitud=10.487845640892&longitud=-66.859912648919',
        'https://www.remax.com.ve/inmuebles/consultorio-medico/alquiler?ubi=Caracas%2C+Libertador%2C+Distrito+Capital%2C+VEN&latitud=10.493246524845&longitud=-66.876311302185',
        'https://www.remax.com.ve/inmuebles/consultorio-medico/alquiler?ubi=Las+Mercedes%2C+Caracas%2C+Baruta%2C+Miranda%2C+VEN&latitud=10.479761011566&longitud=-66.858717013733',
        'https://www.remax.com.ve/inmuebles/consultorio-medico/alquiler?ubi=Altamira%2C+Caracas%2C+Chacao%2C+Miranda%2C+VEN&latitud=10.496198111466&longitud=-66.849815617917',
        'https://www.remax.com.ve/inmuebles/consultorio-medico/alquiler?ubi=Maracaibo%2C+Zulia%2C+VEN&latitud=10.666892897744&longitud=-71.634979248047',
        'https://www.remax.com.ve/inmuebles/consultorio-medico/alquiler?ubi=San+Crist%C3%B3bal%2C+T%C3%A1chira%2C+VEN&latitud=7.7824012610186&longitud=-72.218056653798',
        'https://www.remax.com.ve/inmuebles/consultorio-medico/alquiler?ubi=Matur%C3%ADn%2C+Monagas%2C+VEN&latitud=9.7821619999692&longitud=-63.195827007294'

    ]
    try {

        const allLinks = await getLinksRotatingUrls(AllUrls, 500)

        if (!allLinks) {
            throw new Error('No se encontraron links')
        }

        console.log('todos los links recoelctados de : ', AllUrls.length, ' base urls - ', ' total de links ', allLinks.length)
        console.log('-----------  All links  --------------- ')
        console.log(allLinks)
        console.log('-----------  All links count: ' + allLinks.length + '--------------- ')

        const {
            created,
            duplicates,
            failed
        } = await savePropertyLinks(allLinks, 'remax')

        // Webhook: notificar stats de links recolectados
        const run = await createRun('remax-links');
        await reportJobStatusToHabitas(run.id, 'completado', {
            linksCollected: allLinks.length,
            created,
            duplicatesSkipped: duplicates,
            failed,
        });
        await finishRun(run.id, {
            itemsFound: allLinks.length,
            itemsOk: created,
            itemsError: failed,
        });

        res.json({
            success: true,
            total: allLinks.length,
            created,
            duplicates,
            failed,
        })



    } catch (error) {
        console.error('xxxxxxxxxxxxxxxxxxxxxxxx');
        console.error(error);
        console.error('xxxxxxxxxxxxxxxxxxxxxxxx');
        console.error(error.message);
        console.error('xxxxxxxxxxxxxxxxxxxxxxxx');
        console.log('error en la recolecccion de links de remax');
        res.status(500).json({
            error: 'Error al recolectar links de REMAX',
            message: error.message,
        });
    }
};


export const scrapeRemax = async (req, res, next) => {
    const rawLimit = req.body.limit;
    if (!rawLimit) {
        return res.status(400).json({
            error: 'Debe enviar un limite de propiedades a recolectar (ej. { "limit": 50 })',
        });
    }
    const limit = parseInt(rawLimit, 10);

    const run = await createRun('remax');

    try {
        const properties = await initRemax(limit);
        const { created, duplicates, failed } = await saveScrapedProperties(properties, 'remax');
        await finishRun(run.id, {
            itemsFound: properties.length,
            itemsOk: created,
            itemsError: failed,
        });

        // Webhook: notificar a Habitas los datos recolectados
        await sendPropertiesToHabitas(properties, 'remax');
        await reportJobStatusToHabitas(run.id, 'completado', {
            created,
            duplicatesSkipped: duplicates,
            failed,
        });

        res.json({
            success: true,
            jobId: run.id,
            total: properties.length,
            created,
            duplicates,
            failed,
        });
    } catch (error) {
        console.error('Error en scrapeRemax:', error);
        await finishRun(run.id, {
            itemsFound: 0,
            itemsOk: 0,
            itemsError: 1,
        });
        await reportJobStatusToHabitas(run.id, 'fallido', {
            error: error.message,
        });
        res.status(500).json({
            error: 'Error al hacer scraping de REMAX',
            message: error.message,
        });
    }
};