const WebSocket = require('ws');
const server = new WebSocket.Server({ port: process.env.PORT || 3000 });

let players = {};

server.on('connection', socket => {
  const id = Math.random().toString(36).substr(2, 9);
  players[id] = { x: 100, y: 100 };

  socket.send(JSON.stringify({ type: 'init', id, players }));

  socket.on('message', msg => {
    const data = JSON.parse(msg);
    if (data.type === 'move') {
      players[id] = data.pos;
      broadcast();
    }
  });

  socket.on('close', () => {
    delete players[id];
    broadcast();
  });

  function broadcast() {
    const payload = JSON.stringify({ type: 'update', players });
    server.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
});
