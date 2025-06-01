const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

const players = {};
const mobs = [];

const MAP_WIDTH = 2000;
const MAP_HEIGHT = 2000;

// Broadcast function
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

// Game loop - updates every 100ms
setInterval(() => {
  updateMobs();
  handleMobCollisions();
  broadcast({ type: 'state', players, mobs });
}, 100);

// Health regeneration every 10 seconds
setInterval(() => {
  for (const id in players) {
    const player = players[id];
    if (player.health < 100) {
      player.health = Math.min(100, player.health + 10);
    }
  }
}, 10000);

// Mob spawn every 1 second
setInterval(() => {
  spawnMob();
}, 1000);

// WebSocket connections
wss.on('connection', (ws) => {
  const id = uuidv4();
  const player = {
    id,
    x: Math.random() * MAP_WIDTH,
    y: Math.random() * MAP_HEIGHT,
    username: 'Unknown',
    health: 100,
    color: 'blue',
  };

  players[id] = player;

  ws.send(JSON.stringify({ type: 'init', id }));

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }

    if (data.type === 'move') {
      const p = players[id];
      if (!p) return;
      const speed = 5;
      if (data.keys.includes('up')) p.y -= speed;
      if (data.keys.includes('down')) p.y += speed;
      if (data.keys.includes('left')) p.x -= speed;
      if (data.keys.includes('right')) p.x += speed;
    }

    if (data.type === 'username') {
      if (players[id]) {
        players[id].username = data.username;
      }
    }

    if (data.type === 'chat') {
      broadcast({ type: 'chat', id, username: players[id]?.username, message: data.message });
    }
  });

  ws.on('close', () => {
    delete players[id];
  });
});

// Mob structure
function spawnMob() {
  const type = Math.random() < 0.5 ? 'wanderer' : 'chaser';
  const mob = {
    id: uuidv4(),
    type,
    x: Math.random() * MAP_WIDTH,
    y: Math.random() * MAP_HEIGHT,
    size: 15, // ¾ player size (20 * 0.75 = 15)
  };
  mobs.push(mob);
}

// Update mobs' movement
function updateMobs() {
  for (const mob of mobs) {
    if (mob.type === 'wanderer') {
      const angle = Math.random() * 2 * Math.PI;
      mob.x += Math.cos(angle) * 2;
      mob.y += Math.sin(angle) * 2;
    } else if (mob.type === 'chaser') {
      let closestPlayer = null;
      let minDist = Infinity;
      for (const id in players) {
        const p = players[id];
        const dx = mob.x - p.x;
        const dy = mob.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          closestPlayer = p;
        }
      }
      if (closestPlayer) {
        const dx = closestPlayer.x - mob.x;
        const dy = closestPlayer.y - mob.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          mob.x += (dx / dist) * 3;
          mob.y += (dy / dist) * 3;
        }
      }
    }

    // Keep mobs within bounds
    mob.x = Math.max(0, Math.min(MAP_WIDTH, mob.x));
    mob.y = Math.max(0, Math.min(MAP_HEIGHT, mob.y));
  }
}

// Handle mob-player collisions
function handleMobCollisions() {
  for (const mob of mobs) {
    for (const id in players) {
      const player = players[id];
      const dx = mob.x - player.x;
      const dy = mob.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 20 + mob.size) { // Player size 20
        if (player.health > 0) {
          player.health = Math.max(0, player.health - 5);
        }
      }
    }
  }
}

// Start the server
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});


