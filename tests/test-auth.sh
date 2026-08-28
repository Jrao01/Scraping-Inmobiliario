#!/bin/bash
# Test 1: Autenticación (sin X-Scraper-Key)
# Objetivo: Verificar que todos los endpoints rechazan requests sin API key

SCRAPER_API_KEY="test-scraper-key-12345"

echo "=== Test 1: Autenticación ==="

# Test sin API key (esperado: 401)
echo ""
echo "1.1 POST /scrape/rentahouse sin X-Scraper-Key (esperado: 401 Unauthorized)"
curl -s -w "\nHTTP Status: %{http_code}\n" -X POST http://localhost:3000/scrape/rentahouse \
  -H "Content-Type: application/json" \
  -d '{"rawamount": 1}'

echo ""
echo "1.2 POST /scrape/remax sin X-Scraper-Key (esperado: 401 Unauthorized)"
curl -s -w "\nHTTP Status: %{http_code}\n" -X POST http://localhost:3000/scrape/remax \
  -H "Content-Type: application/json" \
  -d '{"limit": 1}'

echo ""
echo "1.3 POST /ingest sin X-Scraper-Key (esperado: 401 Unauthorized)"
curl -s -w "\nHTTP Status: %{http_code}\n" -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{"source": "rentahouse", "full": false}'

echo ""
echo "1.4 POST /scrape sin X-Scraper-Key (esperado: 401 Unauthorized)"
curl -s -w "\nHTTP Status: %{http_code}\n" -X POST http://localhost:3000/scrape \
  -H "Content-Type: application/json" \
  -d '{"source": "rentahouse", "full": false}'

echo ""
echo "=== Test 1 completado ==="