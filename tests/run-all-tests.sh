#!/bin/bash
# Ejecuta todos los tests de endpoints
# Uso: bash tests/run-all-tests.sh

echo "========================================"
echo "  Iniciando todos los tests de endpoints"
echo "========================================"
echo ""

echo "Ejecutando Test 1: Autenticación..."
bash tests/test-auth.sh
echo ""
echo "Ejecutando Test 2: Scraping RentaHouse..."
bash tests/test-rentahouse.sh
echo ""
echo "Ejecutando Test 3: Scraping REMAX..."
bash tests/test-remax.sh
echo ""
echo "Ejecutando Test 4: Endpoints de ingest..."
bash tests/test-ingest.sh
echo ""
echo "Ejecutando Test 5: Endpoint de contrato..."
bash tests/test-contract.sh

echo ""
echo "========================================"
echo "  Todos los tests completados"
echo "========================================"