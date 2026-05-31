---
name: Lavalink node setup
description: Lavalink setup decisions for the Avon/Radio Discord bot on EC2
---

## Recommended setup (June 2026)
- **Self-hosted on EC2** — only stable solution; public nodes all have random disconnects
- Config: `localhost:2333`, password `youshallnotpass`, `secure: false`
- Run with PM2: `pm2 start "java -jar Lavalink.jar" --name lavalink` from `~/lavalink/`
- Requires Java 17: `sudo apt install openjdk-17-jre-headless`
- Must start lavalink PM2 process BEFORE the bot process on EC2

## Stack
- `shoukaku@4` + `kazagumo@3`
- Node config format: `{ name, url: "host:port", auth, secure }`
- `resumeByLibrary: false` — setting true causes reconnect loops when session is stale

## Shoukaku options (stable settings)
- `reconnectTries: 10`, `reconnectInterval: 3000`, `moveOnDisconnect: true`
- `resumeByLibrary: false` — critical, true causes connect/disconnect loop

## Filter API (v4)
- `player.shoukaku.setFilters({ ...filterData })` (async)
- `player.shoukaku.clearFilters()` (async)

## Why public nodes fail
- All known public nodes (Jirayu, DevamOP, Clxud) drop with WS 1006 under load
- `resumeByLibrary: true` + unstable nodes = infinite reconnect loop
