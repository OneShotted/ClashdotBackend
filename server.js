const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ port: 3000 });
const players = new Map();

wss.on('connection', (ws) => {
  const id = uuidv4();
  const player = { x: 300, y: 300, name: 'Player', id };
  players.set(ws, player);

  ws.send(JSON.stringify({ type: 'id', id }));

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }

    const player = players.get(ws);
    if (!player) return;

    if (data.type === 'register') {
      player.name = data.name;
    }

    if (data.type === 'move') {
      const speed = 5;
      if (data.key === 'up') player.y -= speed;
      if (data.key === 'down') player.y += speed;
      if (data.key === 'left') player.x -= speed;
      if (data.key === 'right') player.x += speed;
    }

    if (data.type === 'chat') {
      broadcast({ type: 'chat', name: player.name, message: data.message });
    }
  });

  ws.on('close', () => {
    players.delete(ws);
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

setInterval(() => {
  const allPlayers = {};
  players.forEach((p) => {
    allPlayers[p.id] = { x: p.x, y: p.y, name: p.name };
  });
  broadcast({ type: 'update', players: allPlayers });
}, 1000 / 30);

console.log('WebSocket server running on ws://localhost:3000');
