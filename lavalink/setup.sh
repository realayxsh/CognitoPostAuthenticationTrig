#!/bin/bash
set -e

echo "=== Lavalink Self-Host Setup ==="

# 1. Install Java 17
echo "[1/4] Installing Java 17..."
sudo apt-get update -qq
sudo apt-get install -y openjdk-17-jdk wget curl

java -version

# 2. Create lavalink directory
echo "[2/4] Setting up lavalink directory..."
mkdir -p ~/lavalink/plugins
mkdir -p ~/lavalink/logs
cd ~/lavalink

# 3. Download latest Lavalink v4 jar
echo "[3/4] Downloading Lavalink v4..."
wget -q --show-progress -O Lavalink.jar \
  "https://github.com/lavalink-devs/Lavalink/releases/latest/download/Lavalink.jar"

echo "Downloaded: $(du -sh Lavalink.jar | cut -f1)"

# 4. Copy application.yml from bot directory
echo "[4/4] Copying config..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "$SCRIPT_DIR/application.yml" ~/lavalink/application.yml

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "IMPORTANT: Edit ~/lavalink/application.yml and replace:"
echo "  SPOTIFY_CLIENT_ID    -> your Spotify client ID"
echo "  SPOTIFY_CLIENT_SECRET -> your Spotify client secret"
echo ""
echo "To start Lavalink now:"
echo "  cd ~/lavalink && java -jar Lavalink.jar"
echo ""
echo "To install as a system service (auto-start on reboot):"
echo "  sudo cp $(dirname $0)/lavalink.service /etc/systemd/system/"
echo "  sudo systemctl daemon-reload"
echo "  sudo systemctl enable lavalink"
echo "  sudo systemctl start lavalink"
echo ""
echo "To check status:"
echo "  sudo systemctl status lavalink"
echo "  sudo journalctl -u lavalink -f"
