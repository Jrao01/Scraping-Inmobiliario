flujos a pulir

inicio servidor

cron() --> scrapear solo primeras 20 paginas para upsert (luego de upsert marcar como no migrado o como actualizado_migrar)

ednpoint habitas /ingest solo mandara segun interruptor full (true false) propiedades migradas o no

endpoint /scrape debe hacer el scraping de recoleccion de actualizaciones / 20 paginas =24o propiedades con cambios mas recientes

endpoint interno /scrape/rentAhouse actualmente como ya hay todos los links solo va recoelctando los detalles (usar misma logica para otros sitios) hacer endpoint para recoelctar links y otro para recolectar detalles 

new

endpoint /scrape/rentALInks 