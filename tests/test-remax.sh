#!/bin/bash
# Test 3: Scraping REMAX
# Objetivo: Probar los endpoints de scraping de REMAX

SCRAPER_API_KEY="test-scraper-key-12345"

echo "=== Test 3: Scraping REMAX ==="

echo ""
echo "3.1 POST /scrape/remaxLinks"
echo "    Recolecta links de REMAX desde URLs predefinidas..."
curl -s -w "\nHTTP Status: %{http_code}\n" -X POST http://localhost:3000/scrape/remaxLinks \
  -H "Content-Type: application/json" \
  -H "X-Scraper-Key: $SCRAPER_API_KEY" \
  -d '{}'

echo ""
echo "3.2 POST /scrape/remax con limit=1"
echo "    Procesa 1 propiedad pendiente de REMAX..."
curl -s -w "\nHTTP Status: %{http_code}\n" -X POST http://localhost:3000/scrape/remax \
  -H "Content-Type: application/json" \
  -H "X-Scraper-Key: $SCRAPER_API_KEY" \
  -d '{"limit": 1}'

echo ""
echo "3.3 POST /ingest remax (novedades)"
echo "    Consulta propiedades de REMAX no sincronizadas..."
curl -s -w "\nHTTP Status: %{http_code}\n" -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -H "X-Scraper-Key: $SCRAPER_API_KEY" \
  -d '{"source": "remax", "full": false}'

echo ""
echo "=== Test 3 completado ==="