const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ port: 3000 });
const players = {};

wss.on('connection', (socket) => {
  const id = uuidv4();

  socket.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      return;
    }

    if (data.type === 'register') {
      players[id] = {
        id,
        name: data.name || 'Player',
        x: Math.random() * 2000,
        y: Math.random() * 2000,
      };
      socket.send(JSON.stringify({ type: 'id', id }));
    }

    const player = players[id];
    if (!player) return;

    if (data.type === 'move') {
      const speed = 5;
      if (data.key === 'up') player.y -= speed;
      if (data.key === 'down') player.y += speed;
      if (data.key === 'left') player.x -= speed;
      if (data.key === 'right') player.x += speed;
    }

    if (data.type === 'chat') {
      const messageData = {
        type: 'chat',
        name: player.name,
        message: data.message,
      };
      broadcast(messageData);
    }
  });

  socket.on('close', () => {
    delete players[id];
  });
});

function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Send player states to all clients 30x/sec
setInterval(() => {
  const state = {
    type: 'update',
    players,
  };
  broadcast(state);
}, 1000 / 30);

console.log('WebSocket server running on ws://localhost:3000');

