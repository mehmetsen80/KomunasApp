#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Starting Komunas Kubernetes VNC Display Server"
echo "=========================================="

# 1. Start Xvfb (Virtual Framebuffer) on display :99
echo "🖥️ Starting Xvfb on display :99..."
Xvfb :99 -screen 0 1280x1024x24 -ac +extension GLX +render -noreset &
XVFB_PID=$!

# Wait for Xvfb to be fully initialized
sleep 3

# Export DISPLAY environment variable so all GUI applications connect to it
export DISPLAY=:99

# 2. Start Fluxbox lightweight Window Manager
# This allows browsers or GUI components to be dragged, styled, or resized properly
echo "🎨 Starting Fluxbox Window Manager..."
fluxbox &
FLUXBOX_PID=$!

# 3. Start x11vnc Server
# Mirrors display :99 on standard VNC port 5900
# -nopw allows connections without password (safe when secured by Kubernetes security/port-forward)
echo "🔒 Starting x11vnc server on port 5900..."
x11vnc -display :99 -forever -shared -nopw -listen localhost -bg &
VNC_PID=$!

# 4. Start noVNC Websocket Proxy
# Translates VNC raw stream to WebSockets so you can access it directly inside a web browser
# Hosts the dashboard on port 8083
echo "🌐 Starting noVNC viewer on port 8083..."
/usr/share/novnc/utils/launch.sh --vnc localhost:5900 --listen 8083 &
NOVNC_PID=$!

echo "✅ Display server stack is running. Access visual display via port 8083!"

# 5. Execute Spring Boot App
echo "☕ Launching Spring Boot application..."
exec java \
    -Dhttps.protocols=TLSv1.2,TLSv1.3 \
    -Djavax.net.ssl.keyStore="${CLIENT_KEY_STORE}" \
    -Djavax.net.ssl.keyStorePassword="${CLIENT_KEY_STORE_PASSWORD}" \
    -Djavax.net.ssl.trustStore="${CACERTS_PATH}" \
    -Djavax.net.ssl.trustStorePassword="${CLIENT_TRUST_STORE_PASSWORD}" \
    -jar KomunasApp.jar
