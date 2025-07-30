#!/bin/bash

echo "🚀 Starting development environment..."

# Start mock server in background
cd mock-server
npm install
node server.js &
MOCK_PID=$!

# Wait a moment for server to start
sleep 2

# Go back to main directory and start frontend
cd ..
npm run dev &
FRONTEND_PID=$!

echo "✅ Mock server started (PID: $MOCK_PID)"
echo "✅ Frontend started (PID: $FRONTEND_PID)"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔐 Mock OIDC: http://localhost:8081" 
echo "📡 Mock API: http://localhost:8080"
echo ""
echo "👤 Login credentials: admin / admin"
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