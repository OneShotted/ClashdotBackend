const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ port: 3000 });
const players = {};

wss.on('connection', (ws) => {
  const id = uuidv4();
  ws.id = id;
  players[id] = {
    x: 300,
    y: 300,
    name: 'Player',
    id,
    isDev: false,
    speedMultiplier: 1
  };

  ws.send(JSON.stringify({ type: 'id', id }));

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }

    // Handle registration
    if (data.type === 'register') {
      if (data.name.includes('#1627')) {
        players[id].name = data.name.replace('#1627', '');
        players[id].isDev = true;
      } else {
        players[id].name = data.name;
      }
    }

    // Handle smooth movement state updates
    if (data.type === 'movementState') {
      if (!players[id]) return;
      const baseSpeed = 6;
      const multiplier = players[id].speedMultiplier || 1;
      const speed = baseSpeed * multiplier;
      const keys = data.keys || {};

      if (keys.up) players[id].y -= speed;
      if (keys.down) players[id].y += speed;
      if (keys.left) players[id].x -= speed;
      if (keys.right) players[id].x += speed;

      broadcastState();
    }

    // Handle normal chat
    if (data.type === 'chat') {
      broadcast({
        type: 'chat',
        name: players[id].name,
        message: data.message
      });
    }

    // Handle dev commands
    if (data.type === 'devCommand' && players[id].isDev) {
      if (data.command === 'kick') {
        const targetId = data.targetId;
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN && client.id === targetId) {
            client.close();
          }
        });
      }

      if (data.command === 'teleport' && players[data.targetId]) {
        players[data.targetId].x = data.x || 300;
        players[data.targetId].y = data.y || 300;
      }

      if (data.command === 'broadcast') {
        broadcast({
          type: 'chat',
          isBroadcast: true,
          message: data.message
        });
      }

      if (data.command === 'setSpeedMultiplier' && typeof data.multiplier === 'number') {
        if (players[data.targetId]) {
          players[data.targetId].speedMultiplier = data.multiplier;
        }
      }
    }
  });

  ws.on('close', () => {
    delete players[ws.id];
  });
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

function broadcastState() {
  broadcast({ type: 'update', players });
}

// 30 FPS
setInterval(broadcastState, 1000 / 30);

console.log('WebSocket server running on ws://localhost:3000');
