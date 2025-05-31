const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ port: 3000 });
const players = {};
const devs = new Set();

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
      if (data.isDev) {
        devs.add(id);
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

    if (data.type === 'dev' && devs.has(id)) {
      if (data.action === 'teleport') {
        players[id].x = data.x;
        players[id].y = data.y;
      } else if (data.action === 'kick') {
        for (const pid in players) {
          if (players[pid].name === data.targetName) {
            broadcast({ type: 'chat', name: '[SERVER]', message: `${data.targetName} was kicked.` });
            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN && client.id === pid) {
                client.close();
              }
            });
            delete players[pid];
          }
        }
      } else if (data.action === 'broadcast') {
        broadcast({ type: 'chat', name: '[SERVER]', message: data.message });
      }
    }
  });

  ws.on('close', () => {
    delete players[id];
    devs.delete(id);
  });

  ws.id = id;
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
