#!/bin/bash
# Test 5: Endpoint de contrato (/scrape)
# Objetivo: Simular que Habitas solicita un scraping completo

SCRAPER_API_KEY="test-scraper-key-12345"

echo "=== Test 5: Endpoint de contrato ==="

echo ""
echo "5.1 POST /scrape (contrato) con source=rentahouse, full=false"
echo "    Endpoint que Habitas llama para iniciar scraping..."
curl -s -w "\nHTTP Status: %{http_code}\n" -X POST http://localhost:3000/scrape \
  -H "Content-Type: application/json" \
  -H "X-Scraper-Key: $SCRAPER_API_KEY" \
  -d '{"source": "rentahouse", "full": false}'

echo ""
echo "5.2 POST /scrape (contrato) con source=remax, full=false"
curl -s -w "\nHTTP Status: %{http_code}\n" -X POST http://localhost:3000/scrape \
  -H "Content-Type: application/json" \
  -H "X-Scraper-Key: $SCRAPER_API_KEY" \
  -d '{"source": "remax", "full": false}'

echo ""
echo "=== Test 5 completado ==="