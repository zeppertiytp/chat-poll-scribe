#!/bin/bash

echo "🚀 Starting development environment..."

# Start mock server in background
cd mock-server
if [ ! -d "node_modules" ]; then
  echo "📦 Installing mock server dependencies..."
  npm install
fi
node server.js &
MOCK_PID=$!

# Wait a moment for server to start
sleep 2

# Go back to main directory and start frontend
cd ..
if [ ! -d "node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  npm install
fi
npm run dev &
FRONTEND_PID=$!

echo "✅ Mock server started (PID: $MOCK_PID)"
echo "✅ Frontend started (PID: $FRONTEND_PID)"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔐 Mock servers will auto-detect available ports"
echo "📡 Check console output above for actual ports used"
echo ""
echo "👤 Login credentials: admin / admin"
echo ""
echo "⚠️  If ports changed, update .env.local accordingly"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping servers..."
    kill $MOCK_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for any process to exit
wait