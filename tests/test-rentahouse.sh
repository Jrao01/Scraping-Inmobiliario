#!/bin/bash
# Test 2: Scraping RentaHouse
# Objetivo: Probar los endpoints de scraping de RentaHouse

SCRAPER_API_KEY="test-scraper-key-12345"

echo "=== Test 2: Scraping RentaHouse ==="

echo ""
echo "2.1 POST /scrape/rentahouse con rawamount=1"
echo "    Inicia scraping de 1 propiedad de RentaHouse..."
curl -s -w "\nHTTP Status: %{http_code}\n" -X POST http://localhost:3000/scrape/rentahouse \
  -H "Content-Type: application/json" \
  -H "X-Scraper-Key: $SCRAPER_API_KEY" \
  -d '{"rawamount": 1}'

echo ""
echo "2.2 POST /scrape/rentALinks con rawamount=1"
echo "    Recolecta links de 1 pagina de RentaHouse..."
curl -s -w "\nHTTP Status: %{http_code}\n" -X POST http://localhost:3000/scrape/rentALinks \
  -H "Content-Type: application/json" \
  -H "X-Scraper-Key: $SCRAPER_API_KEY" \
  -d '{"rawamount": 1}'

echo ""
echo "2.3 POST /ingest rentahouse (novedades)"
echo "    Consulta propiedades no sincronizadas..."
curl -s -w "\nHTTP Status: %{http_code}\n" -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -H "X-Scraper-Key: $SCRAPER_API_KEY" \
  -d '{"source": "rentahouse", "full": false}'

echo ""
echo "=== Test 2 completado ==="