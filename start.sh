#!/bin/bash
# CivicConnect launcher script
# Starts the backend API (port 4000) and frontend dev server (port 5173)

set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Stopping any existing CivicConnect processes..."
pkill -f "civic-app/server/index.js" 2>/dev/null || true
pkill -f "civic-app/client/node_modules/.bin/vite" 2>/dev/null || true
sleep 1

echo "Installing server dependencies (if needed)..."
cd "$DIR/server" && [ -d node_modules ] || npm install

echo "Installing client dependencies (if needed)..."
cd "$DIR/client" && [ -d node_modules ] || npm install

echo "Seeding database (only runs if no data exists)..."
cd "$DIR/server" && node seed.js

echo "Starting backend on http://localhost:4000 ..."
cd "$DIR/server" && setsid nohup node index.js > /tmp/civic-server.log 2>&1 < /dev/null &
disown
sleep 2

echo "Starting frontend on http://localhost:5173 ..."
cd "$DIR/client" && setsid nohup node_modules/.bin/vite --host --port 5173 > /tmp/civic-client.log 2>&1 < /dev/null &
disown
sleep 3

echo ""
echo "✅ CivicConnect is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:4000/api/health"
echo ""
echo "Demo logins:"
echo "   Admin:   admin@civicconnect.gov / Admin@123"
echo "   Officer: roads.officer@civicconnect.gov / Officer@123"
echo "   Citizen: ravi@example.com / Citizen@123"
echo ""
echo "Logs: /tmp/civic-server.log and /tmp/civic-client.log"
