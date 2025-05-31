const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 3000 });

const players = {};
const sockets = new Map();

server.on('connection', (socket) => {
  const id = Math.random().toString(36).substr(2, 9);
  players[id] = { name: 'Player', x: 300, y: 300 };
  sockets.set(socket, id);

  socket.send(JSON.stringify({ type: 'init', id }));

  socket.on('message', (msg) => {
    const data = JSON.parse(msg);
    const id = sockets.get(socket);

    if (!id) return;

    if (data.type === 'register') {
      players[id].name = data.name || players[id].name;
    }

    if (data.type === 'move') {
      players[id].x = data.x;
      players[id].y = data.y;
    }

    if (data.type === 'chat') {
      const payload = JSON.stringify({
        type: 'chat',
        name: players[id].name,
        message: data.message,
      });

      server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    }
  });

  socket.on('close', () => {
    const id = sockets.get(socket);
    delete players[id];
    sockets.delete(socket);
  });
});

setInterval(() => {
  const payload = JSON.stringify({ type: 'state', players });
  server.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}, 1000 / 20); // 20 FPS

