#!/bin/bash
echo "======================================================"
echo "  Tarlac Tourism - Inventory Supply Data System"
echo "======================================================"

echo "[1/3] Installing root dependencies..."
npm install --ignore-scripts || exit 1

echo "[2/3] Installing backend dependencies..."
cd backend && npm install || exit 1
cd ..

echo "[3/3] Installing frontend dependencies..."
cd frontend && npm install || exit 1
cd ..

if [ ! -f backend/.env ]; then
  cp .env.example backend/.env
  echo "[ENV] backend/.env created"
fi

echo ""
echo "======================================================"
echo "  SETUP COMPLETE!"
echo "  npm run dev       — start both servers"
echo "  npm run seed      — load sample data"  
echo "  Open: http://localhost:3000"
echo "  Login: admin@tarlac.gov.ph / Admin@2026"
echo "======================================================"
