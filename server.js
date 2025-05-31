const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ port: 3000 });
const players = {};

wss.on('connection', (ws) => {
  const id = uuidv4();
  ws.id = id;
  players[id] = { x: 300, y: 300, name: 'Player', id, isDev: false };

  ws.send(JSON.stringify({ type: 'id', id }));

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }

    if (data.type === 'register') {
      if (data.name.includes('#1627')) {
        players[id].name = data.name.replace('#1627', '');
        players[id].isDev = true;
      } else {
        players[id].name = data.name;
      }
    }

    if (data.type === 'move') {
      const speed = 5;
      if (data.key === 'up') players[id].y -= speed;
      if (data.key === 'down') players[id].y += speed;
      if (data.key === 'left') players[id].x -= speed;
      if (data.key === 'right') players[id].x += speed;
    }

    if (data.type === 'chat') {
      broadcast({ type: 'chat', name: players[id].name, message: data.message });
    }

    if (data.type === 'devCommand' && players[id].isDev) {
      const { command, targetId, x, y, message } = data;

      if (command === 'kick' && players[targetId]) {
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN && client.id === targetId) {
            client.close();
          }
        });
      }

      if (command === 'teleport' && players[targetId]) {
        players[targetId].x = typeof x === 'number' ? x : 300;
        players[targetId].y = typeof y === 'number' ? y : 300;
      }

      if (command === 'broadcast') {
        broadcast({ type: 'chat', name: '[DEVELOPER]', message });
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

setInterval(() => {
  broadcast({ type: 'update', players });
}, 1000 / 30);

console.log('WebSocket server running on ws://localhost:3000');

