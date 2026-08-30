# scraping_inmobiliario

Microservicio de scraping de propiedades inmobiliarias en Venezuela. Recolecta anuncios de RentaHouse y Remax y los envia al backend de Habitas (realHabitas/backend-residencias).

## Tabla de contenidos

- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Endpoints](#endpoints)
- [Base de datos SQLite](#base-de-datos-sqlite)
- [Flujo de datos](#flujo-de-datos)
- [Cron jobs](#cron-jobs)
- [Docker](#docker)
- [Variables de entorno](#variables-de-entorno)
- [Integracion con Habitas](#integracion-con-habitas)
- [Seguridad](#seguridad)

## Arquitectura

Dos fases de scraping:

| Fase | Qué hace | Endpoints |
|------|----------|-----------|
| 1. Recolectar links | Scraping de páginas de búsqueda | /scrape/rentALinks, /scrape/remaxLinks |
| 2. Scrapear detalles | Lee links de la DB, scrapea cada propiedad | /scrape/rentahouse, /scrape/remax |

Modelo de datos:

| Tabla | Propósito |
|-------|-----------|
| scraped_properties | Propiedades scrapeadas para Habitas |
| property_links | URLs descubiertas (pending/scraped/error) |
| scraping_runs | Historial de ejecuciones |

## Estructura del proyecto

scraping_inmobiliario/
  app.js - Punto de entrada de Express
  package.json - Dependencias
  Dockerfile - Imagen Docker
  .dockerignore - Archivos ignorados en build
  .env.example - Plantilla de variables de entorno
  .gitignore - Archivos ignorados por git
  CONTRATO-API-SCRAPER.md - Contrato con Habitas
  README.md - Este archivo
  config/ - Configuración de base de datos
    database.js
    models/
      index.js - Barrel de modelos
      ScrapedProperty.js
      PropertyLink.js
      ScrapingRun.js
  controllers/
    scraperController.js - /scrape, /ingest
    rentaHouse.js - /scrape/rentahouse, /scrape/rentALinks
    remax.js - /scrape/remax, /scrape/remaxLinks
  middleware/
    auth.mjs - requireScraperKey
  routes/
    Routes.js - Definición de rutas
  services/
    rentaHouse.js - initRentaHouse (scrapea detalles)
    rentaHouseLinks.js - collectAndSaveLinks (recolecta links)
    remax.js - initRemax
    remaxLinks.js - getLinksRotatingUrls
    formatForHabitas.js - Formatea para el contrato
    notifyHabitas.js - Webhooks a Habitas
    scraperRepository.js - CRUD de DB
    getPages.js - fetchPageWithRetry con cheerio
    cronService.js - Jobs programados
  utils/
    normalizeType.js
    normalizeListingType.js
    normalizePriceType.js
    normalizePriceRate.js
  static/ - Assets estáticos (ignorados)
  tests/ - Tests (ignorados)

## Endpoints

Todos los endpoints requieren el header X-Scraper-Key con el valor de SCRAPER_API_KEY.

| Método | Endpoint | Descripción | Body |
|--------|----------|-------------|------|
| POST | /scrape | Contrato con Habitas - solicita scraping | { source, full } |
| POST | /scrape/rentahouse | Scrapea N propiedades de RentaHouse desde la DB | { rawamount: 5 } |
| POST | /scrape/remax | Scrapea N propiedades de Remax desde la DB | { limit: 50 } |
| POST | /scrape/rentALinks | Recolecta links de RentaHouse (N páginas) | { rawamount: 5 } |
| POST | /scrape/remaxLinks | Recolecta links de Remax (10 ciudades) | {} |
| POST | /ingest | Pull - devuelve propiedades scrapeadas | { source, full } |
| GET | / | Health check | { message: "activo" } |

### Endpoint de ingestión (POST /ingest)

Pull desde el scraper. Habitas solicita las propiedades ya scrapeadas.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| source | string | Fuente (rentahouse, remax) |
| full | boolean | true = todas las propiedades; false = solo las no sincronizadas |

## Base de datos SQLite

Tabla scraped_properties: id, outer_source, source_url, external_id, title, description, type, listing_type, price, price_type, price_rate, lat, lng, bedrooms, bathrooms, area, furnished, features, images, main_image, synced_at.

Tabla property_links: id, link, source, status, scraped_at.

## Flujo de datos

### Flujo principal (push - Habitas a Scraper)

1. Habitas: POST /scraper/request { source, full }
2. Backend crea ScraperJob (status: solicitado)
3. Backend llama: POST {scraper}/scrape { source, full }
4. Scraper: 202 Accepted (procesa en background)
   - FASE 1: collectAndSaveLinks / getLinksRotatingUrls
     -> HTTP a páginas de búsqueda
     -> Guarda links en property_links (status=pending)
   - FASE 2: initRentaHouse / initRemax
     -> getPendingLinks() (lee pending de DB)
     -> HTTP a cada página de propiedad
     -> Extrae detalles (precio, ubicación, imágenes)
     -> markLinkAsScraped()
5. Scraper: sendPropertiesToHabitas()
   -> POST /api/properties/scraper/ingest { sourceName, properties[] }
   -> Backend valida y guarda en PostgreSQL (status=pending)
6. Scraper: reportJobStatusToHabitas()
   -> POST /api/scraper/jobs/:id/report { status: "completado" }
   -> Backend actualiza ScraperJob a completado

### Flujo de pull (scraper a Habitas)

1. Habitas: POST /api/scraper/import { sourceName, full }
2. Backend llama: POST {scraper}/ingest { source, full }
3. Scraper devuelve todas o las no-sync properties
4. Backend las inserta con runScrapedBatch()

## Cron jobs

El servicio tiene un cron que se ejecuta automáticamente (cada 6 horas por defecto):

CRON_SCHEDULE = process.env.CRON_SCHEDULE || "0 */6 * * *"

Fase 1: Recolecta links de las primeras 20 páginas de RentaHouse
Fase 2: Scrapea los detalles de los links actualizados en la última hora

## Docker

### Construir

docker build -t scraping_inmobiliario .

### Ejecutar

docker run -p 3000:3000 --env-file .env scraping_inmobiliario

### En docker-compose (backend-residencias)

El scraper está definido en realHabitas/backend-residencias/docker-compose.yml:

- context: ../../scraping_Inmobiliario
- ports: "3000:3000"
- env_file: ../../scraping_Inmobiliario/.env
- volumes: scraper_data:/app/data
- depends_on: backend

### Volúmenes

- scraper_data: /app/data (Persiste SQLite entre reinicios)

## Variables de entorno

Crea un .env basado en .env.example:

cp .env.example .env

### Variables de scraping

- rentahouseUrl: https://rentahouse.com.ve/buscar-propiedades
- inmueblesConLupaurl: https://www.inmueblesconlupa.com/buscar
- CHROME_PATH: /usr/bin/chromium
- PUPPETEER_SKIP_DOWNLOAD: true
- PORT: 3000
- DEFAULT_PAGES: 6
- DEFAULT_SCRAPER_CLICKS: 5

### Variables de integración con Habitas

- SCRAPER_API_KEY: Clave compartida para autenticación (X-Scraper-Key)
- HABITAS_API_URL: URL base del backend Habitas (ej: http://backend:5000)
- SCRAPER_SERVICE_URL: URL de este microservicio (ej: http://scraper:3000)

### Cron

- CRON_SCHEDULE: 0 */6 * * * (Schedule del cron)

## Integracion con Habitas

### Contrato

Detalles completos en CONTRATO-API-SCRAPER.md.

### Panel Admin - Sección Recopilación (Scraping)

El panel de administración (frontend-residencias) tiene una sección para orquestar el scraper:

**Pestaña Solicitar:**
- Select de fuente (rentahouse, remax, rentahouse-links, remax-links)
- Input numérico para cantidad de páginas/propiedades
- Toggle de recopilación completa (full)
- Botón Solicitar recopilar -> POST /api/scraper/request

**Pestaña Importar lote:**
- Select de fuente (rentahouse, remax)
- Toggle Todo el lote / Solo novedades (full)
- Botón Importar desde microservicio -> POST /api/scraper/import -> pull desde /ingest del scraper
- Opción de importar JSON manualmente

**Pestaña Historial:**
- Lista de jobs de scraping con badges de estado (solicitado, en_progreso, completado, fallido)

### Endpoints de administración (backend)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | /api/scraper/request | admin (JWT) | Solicita scraping |
| GET | /api/scraper/jobs | admin (JWT) | Lista historial de jobs |
| GET | /api/scraper/jobs/pending | X-Scraper-Key | Scraper polling de pending jobs |
| POST | /api/scraper/jobs/:id/report | X-Scraper-Key | Scraper reporta status |
| POST | /api/properties/scraper/ingest | X-Scraper-Key | Scraper envía propiedades |
| POST | /api/scraper/import | admin (JWT) | Importar lote (pull del scraper o JSON manual) |

## Seguridad

### Autenticación

Todos los endpoints del scraper usan el header X-Scraper-Key:

X-Scraper-Key: <SCRAPER_API_KEY>

- Endpoints propios (/scrape/*, /ingest): protegidos con requireScraperKey middleware
- Endpoints del contrato (/scrape): también protegidos con requireScraperKey

### Reglas de seguridad

1. SCRAPER_API_KEY - Debe ser una cadena larga y aleatoria. Generar con: openssl rand -hex 32
2. ownerContact - Datos sensibles. Solo accesible para operadores/admin.
3. sourceUrl - Debe ser único. No cambiar entre ejecuciones para evitar duplicados.
4. lat/lng - Obligatorios. Sin coordenadas, la propiedad no se inserta.

## Scripts migratorios

npx ts-node src/scripts/migrate-missing-fields.ts

## Troubleshooting

- El scraper no arranca en Docker: docker-compose logs scraper
- Error de sqlite3 en Docker: npm rebuild sqlite3 --build-from-source
- El cron no se ejecuta: docker-compose logs scraper | grep Cron
- Propiedades duplicadas: source_url es la clave de deduplicación
- Propiedades faltantes: Si falta algún campo, esa fila se marca como failed pero el resto del lote se procesa normalmente.
