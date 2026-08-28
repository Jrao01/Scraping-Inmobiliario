#!/bin/bash
# Test 4: Endpoints de ingest
# Objetivo: Probar la consulta de propiedades formateadas para Habitas

SCRAPER_API_KEY="test-scraper-key-12345"

echo "=== Test 4: Endpoints de ingest ==="

echo ""
echo "4.1 POST /ingest rentahouse (novedades - full=false)"
echo "    Devuelve solo propiedades no sincronizadas..."
curl -s -w "\nHTTP Status: %{http_code}\n" -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -H "X-Scraper-Key: $SCRAPER_API_KEY" \
  -d '{"source": "rentahouse", "full": false}'

echo ""
echo "4.2 POST /ingest rentahouse (todo - full=true)"
echo "    Devuelve todas las propiedades de RentaHouse..."
curl -s -w "\nHTTP Status: %{http_code}\n" -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -H "X-Scraper-Key: $SCRAPER_API_KEY" \
  -d '{"source": "rentahouse", "full": true}'

echo ""
echo "4.3 POST /ingest remax (todo - full=true)"
echo "    Devuelve todas las propiedades de REMAX..."
curl -s -w "\nHTTP Status: %{http_code}\n" -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -H "X-Scraper-Key: $SCRAPER_API_KEY" \
  -d '{"source": "remax", "full": true}'

echo ""
echo "=== Test 4 completado ==="