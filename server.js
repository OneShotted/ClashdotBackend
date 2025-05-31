const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ port: 3000 });
const players = {};

wss.on('connection', (ws) => {
  const id = uuidv4();
  players[id] = { x: 300, y: 300, name: `Player`, id };

  ws.send(JSON.stringify({ type: 'id', id }));

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }

    if (data.type === 'register') {
      players[id].name = data.name;
    }

    if (data.type === 'move') {
      const speed = 5;
      console.log(`Received move key: ${data.key}`);
      if (data.key === 'up') players[id].y -= speed;
      if (data.key === 'down') players[id].y += speed;
      if (data.key === 'left') players[id].x -= speed;
      if (data.key === 'right') players[id].x += speed;
    }

    if (data.type === 'chat') {
      broadcast({ type: 'chat', name: players[id].name, message: data.message });
    }
  });

  ws.on('close', () => {
    delete players[id];
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
  broadcast({ type: 'update', players });
}, 1000 / 30);

console.log('WebSocket server running on ws://localhost:3000');
