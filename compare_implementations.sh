#!/bin/bash
# Compare Python and TypeScript implementations

echo "==================================================================="
echo "COMPARING PYTHON AND TYPESCRIPT IMPLEMENTATIONS"
echo "==================================================================="
echo ""

# Test point
W="0.5,-0.3,0.2"
LAMBDA="0.1"

echo "Test configuration:"
echo "  w = [$W]"
echo "  lambda = $LAMBDA"
echo "  dataset = crescent.json"
echo ""

# Python results
echo "-------------------------------------------------------------------"
echo "PYTHON RESULTS (from gradient verification):"
echo "-------------------------------------------------------------------"
cd python && .venv/bin/python test_gradient_verification.py 2>&1 | grep -A 20 "Testing"

echo ""
echo "-------------------------------------------------------------------"
echo "TYPESCRIPT RESULTS (from gradient verification):"
echo "-------------------------------------------------------------------"
cd .. && npx tsx test-gradient-consistency.ts 2>&1 | grep -A 15 "Testing"
