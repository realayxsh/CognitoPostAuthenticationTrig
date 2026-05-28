---
name: Lavalink node setup for Replit
description: Which Lavalink nodes work from Replit and what stack version is required
---

## Working node (confirmed May 2026)
- **Jirayu**: `lavalink.jirayu.net:443`, password `youshallnotpass`, secure: true
- WebSocket reachable from Replit at `wss://lavalink.jirayu.net:443/v4/websocket` ✅
- Lavalink v4 — requires Shoukaku v4 + Kazagumo v3

## Stack
- `shoukaku@4` + `kazagumo@3` (upgraded from v3/v2)
- Node config format unchanged: `{ name, url: "host:port", auth, secure }`

## Filter API change (v3 → v4)
- Old: `player.send({ op: 'filters', guildId, ...filterData })`
- New: `player.shoukaku.setFilters({ ...filterData })` (async)
- Clear all: `player.shoukaku.clearFilters()` (async)
- Disable specific filter: `player.shoukaku.setFilters({ filterName: null })`

## Why Replit blocks other nodes
- WS on port 80 (ws://) is blocked by Replit — only WSS (port 443) works reliably for WebSocket
- Serenetia nodes: HTTP works but WebSocket times out from Replit
