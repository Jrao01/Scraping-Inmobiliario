# Contrato del microservicio de scraping — para Julián

¡Hola Julián!

Te dejo todo lo que necesitas saber para que el scraper que estás haciendo quede listo para conectarse a Habitas. La idea es clara: tu microservicio solo se encarga de **recopilar los anuncios de propiedades en Venezuela** y dejarlos en tu base SQLite. Yo, del lado de Habitas, ya preparé el backend para recibir esos datos e insertarlos en la base principal.

Lo que sigue es el esquema de tu base de datos, el formato JSON que vas a enviarme y las reglas que debes respetar para que todo encaje. También te listo qué cosas NO debes hacer para no romper el flujo.

---

## 1. Tu base de datos SQLite

Te conviene una tabla principal donde guardes cada anuncio tal como lo capturaste. Te la dejo lista:

```sql
CREATE TABLE scraped_properties (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,  -- id interno del scraper
  outer_source        TEXT NOT NULL,                      -- "ConClave Inmobiliario", "Venezolana de Propiedades", etc.
  source_url          TEXT NOT NULL UNIQUE,               -- URL del anuncio original (CLAVE DE DEDUP)
  external_id         TEXT,                               -- id del anuncio en el sitio fuente (si existe)
  title               TEXT NOT NULL,
  description         TEXT,
  type                TEXT NOT NULL,                      -- ver ENUM en §3
  listing_type        TEXT NOT NULL DEFAULT 'Alquiler',   -- 'Alquiler' | 'Venta'
  price               REAL NOT NULL,                      -- en USD
  price_type          TEXT DEFAULT 'monthly',             -- 'monthly' | 'daily'
  price_rate          TEXT DEFAULT 'paralelo',            -- 'oficial' | 'paralelo'
  owner_name          TEXT,                               -- propietario tal como lo publica la fuente
  owner_photo         TEXT,                               -- URL de la foto de perfil del propietario
  owner_contact       TEXT,                               -- WhatsApp/teléfono del dueño (solo operadores) PRIVADO
  address             TEXT,
  location            TEXT NOT NULL,                      -- zona / sector
  neighborhood        TEXT,
  city                TEXT,
  state               TEXT,
  zip_code            TEXT,
  lat                 REAL NOT NULL,                      -- obligatorio (si falta, geocodificar por dirección)
  lng                 REAL NOT NULL,
  bedrooms            INTEGER DEFAULT 0,
  bathrooms           INTEGER DEFAULT 0,
  area                REAL DEFAULT 0,
  furnished           INTEGER DEFAULT 0,                  -- 0/1
  features            TEXT,                               -- JSON string "[\"A/C\",\"Balcón\"]"
  main_image          TEXT,                               -- URL de la imagen principal
  images              TEXT,                               -- JSON string "[url1, url2...]"
  scraped_at          TEXT NOT NULL,                      -- fecha de captura ISO
  created_at          TEXT DEFAULT (datetime('now'))
);
```

Si quieres llevar registro de cuándo corre el scraper, puedes usar esta tabla de control:

```sql
CREATE TABLE scraping_runs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  source_name TEXT NOT NULL,
  started_at  TEXT NOT NULL,
  finished_at TEXT,
  items_found  INTEGER DEFAULT 0,
  items_ok     INTEGER DEFAULT 0,
  items_error  INTEGER DEFAULT 0
);
```

---

## 2. El JSON que me vas a enviar

Esto es lo que Habitas espera recibir. El endpoint está protegido (token de admin + clave del microservicio) y es solo para insertar en lote:

```
POST /api/properties/scraper/ingest
Headers:
  Authorization: Bearer <token admin>
  X-Scraper-Key: <clave del microservicio>
  Content-Type: application/json
```

Body:

```json
{
  "sourceName": "ConClave Inmobiliario",
  "properties": [
    {
      "sourceUrl": "https://www.ejemplo.com/anuncio-123",
      "title": "Apartamento 2 hab en El Paraíso, Caracas",
      "description": "Amplio apartamento con vista...",
      "type": "Apartamento",
      "listingType": "Alquiler",
      "price": 150,
      "priceType": "monthly",
      "priceRate": "paralelo",
      "ownerName": "María García",
      "ownerPhoto": "https://cdn.ejemplo.com/avatares/maria.jpg",
      "ownerContact": "+58 412 111 2233",
      "address": "Av. Principal, Edif. Soler, Piso 3, Apto B",
      "location": "El Paraíso, Caracas",
      "neighborhood": "El Paraíso",
      "city": "Caracas",
      "state": "Distrito Capital",
      "lat": 10.4915,
      "lng": -66.8623,
      "bedrooms": 2,
      "bathrooms": 1,
      "area": 70,
      "furnished": true,
      "features": ["A/C", "Balcón", "Ascensor"],
      "mainImage": "https://cdn.ejemplo.com/fotos/1.jpg",
      "images": ["https://cdn.ejemplo.com/fotos/1.jpg", "https://cdn.ejemplo.com/fotos/2.jpg"]
    }
  ]
}
```

Respuesta de Habitas:

```json
{
  "success": true,
  "data": {
    "created": 95,
    "duplicatesSkipped": 12,
    "failed": [
      { "sourceUrl": "https://...", "error": "price requerido" }
    ]
  }
}
```

### Reglas del contrato
- `sourceName` va a nivel raíz (una sola fuente por lote).
- Omití cualquier campo que venga `null` o que no conozcas.
- `images` y `features` son **arrays**, no strings.
- Toda propiedad se inserta con estado **`pending`** (después un operador la aprueba en el panel). No envies un campo de estado.

### Campos requeridos
Si falta alguno, esa fila se marca como `failed` (no se pierde el resto del lote):
`sourceUrl`, `title`, `type`, `listingType`, `price`, `lat`, `lng`, y al menos `location` o `address`.

### Campos opcionales (con valor por defecto)
`priceType` → `monthly`, `priceRate` → `paralelo`, `bedrooms`/`bathrooms`/`area` → 0, `furnished` → false, `features` → `[]`.
Si no envías `mainImage`, usamos la primera de `images`.
`ownerName`, `ownerPhoto`, `ownerContact`, `neighborhood`, `city`, `state`, `zip_code` pueden venir vacíos.

---

## 3. Valores permitidos (¡importante!)

Los enums de Habitas son pegados. Normaliza lo que scrapees a estos valores:

- **`type`** (solo estos 7):
  `Residencia` · `Apartamento` · `Casa` · `Finca` · `Local` · `Terreno` · `Hotel`
  (Antes existía "Cuarto", pero fue reemplazado por "Hotel". Si la fuente dice "Habitación/Cuarto", evalúa mapearlo a `Hotel` o `Residencia`.)
- **`listingType`**: `Alquiler` · `Venta`
- **`priceType`**: `monthly` · `daily`
- **`priceRate`**: `oficial` · `paralelo`

---

## 4. Modelo donde aterrizará en Habitas

Tu JSON se inserta en la tabla `properties` de Habitas (PostgreSQL). Estructura:

| Campo SQLite / JSON | Columna Habitas | Nota |
|---|---|---|
| — | `authorId` | **No lo envies.** Habitas crea/reutiliza un usuario real `role: propietario` a partir de `ownerName`+`ownerContact` (si no vienen, usa el usuario de sistema "Habitas Equipo"). |
| `title` | `title` | |
| `description` | `description` | |
| `type` | `type` | enum §3 |
| `listing_type` | `listingType` | enum §3 |
| `price` | `price` | USD decimal |
| `price_type` | `priceType` | enum §3 |
| `price_rate` | `priceRate` | enum §3 |
| `lat` / `lng` | `lat` / `lng` | obligatorio |
| `address` / `location` | `address` / `location` | |
| `neighborhood`/`city`/`state`/`zip_code` | `neighborhood`/`city`/`state`/`zipCode` | |
| `bedrooms`/`bathrooms`/`area` | `bedrooms`/`bathrooms`/`area` | |
| `furnished` | `furnished` | bool |
| `features` | `features` | json array |
| `images` | `images` | json array (URLs externas tal cual) |
| `main_image` | `mainImage` | si falta → primera de `images` |
| — | `status` | se crea `pending` |
| `owner_name` | `sourceAuthorName` | **público** → nombre del propietario en cards/detalle |
| `owner_photo` | `sourceAuthorPhoto` | **público** → foto de perfil (si falta: avatar genérico) |
| `owner_contact` | `sourceContact` | **PRIVADO** → solo operadores; nunca se expone al público. También alimenta el `phone` del usuario del propietario real (interno). |
| `outer_source` (+ raíz) | `sourceName` | **público** → insignia "recopilada de {source}" |
| `source_url` | `sourceUrl` | **público** (enlace "Ver anuncio original") y **único** para evitar duplicados |
| — | `isScraped` | true en toda inserción vía este contrato |

---

## 5. Cosas que NO debes hacer (para no rompernos el flujo)

1. **No tocar el flujo de los propietarios de Habitas.** Esto es un canal paralelo: los propietarios siguen creando sus propiedades normalmente dentro de la plataforma. Tu `POST` solo inserta recopiladas con `isScraped=true`.
2. **`lat`/`lng` son obligatorios.** Si el sitio no te las da, geocodifica por la dirección antes de guardarla en tu SQLite. Sin coordenadas, no insertamos.
3. **`ownerContact` es sensible.** Puedes guardarlo en tu base, pero Habitas lo esconde al público. No lo pongas en ninguna parte visible de tus logs o scripts compartidos.
4. **No cambies el `sourceUrl`** entre ejecuciones: es mi llave para no crear duplicados. Si un anuncio se mueve de URL, será un anuncio nuevo.
5. **No envies `id` ni `status`** en el JSON: Habitas los genera.

---

## 6. Orquestación: Habitas solicita y tú recopilas

Además del push (`POST /ingest`), el panel admin de Habitas puede **solicitar** una recopilación. Esto es lo que necesitas para integrarlo:

### 6.1 Endpoint que TU microservicio debe exponer (llamado por Habitas)

```
POST {SCRAPER_SERVICE_URL}/scrape
Content-Type: application/json
```

Body:

```json
{
  "source": "ConClave Inmobiliario",   // nullable → "" = todas las fuentes
  "full": false                         // true = recopilar todo de nuevo; false = solo novedades
}
```

- Respuesta esperada: **`202 Accepted`** (aceptas la tarea y la procesas en background) o **`4xx/5xx`** si no puedes.
- Después de recopilar, envías los datos con el `POST /api/properties/scraper/ingest` (§2) normalmente.

### 6.2 Polling opcional (tú puedes consumir las solicitudes pendientes)

Si prefieres que Habitas no te llame, puedes **botar** las solicitudes que los admin marcaron como pendientes:

```
GET /api/scraper/jobs/pending      # devuelve array de solicitudes {id, source, fullScrape}
Headers: X-Scraper-Key: <clave>
```

Y luego avisas el estado en Habitas:

```
POST /api/scraper/jobs/:id/report     # X-Scraper-Key en el header
{
  "status": "en_progreso" | "completado" | "fallido",
  "error": "opcional, si falló",
  "summary": { "created": 95, "duplicatesSkipped": 12, "failed": 3 }  // opcional
}
```

### 6.3 Variables de entorno

| Variable (Habitas) | Uso |
|---|---|
| `SCRAPER_SERVICE_URL` | URL base de tu microservicio (ej. `https://scraper.habitas.app`). Si no está, el admin solo puede importar manualmente. |
| `SCRAPER_API_KEY` | Clave compartida (`X-Scraper-Key`) para que solo tú (y los admin) puedan insertar/consultar. |

> Mientras tu microservicio no esté listo, el admin puede **importar lotes manualmente** desde el nuevo panel "Recopilación (Scraping)" (`POST /api/scraper/import`, sesión de admin, sin `X-Scraper-Key`): solo pega el JSON del lote y se inserta igual.

---

Si tienes dudas con algún campo o un caso raro de un sitio hosting (precios en bolívares, anuncios sin fotos, etc.), me avisas y ajustamos el mapeo. En cuanto tengas la data lista, me pasas la URL y/o exportas y yo la inserto en Habitas.

¡Éxito con el scraper! 🚀