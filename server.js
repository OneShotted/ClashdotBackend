const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 3000 });

let players = {};

server.on('connection', socket => {
  const id = Math.random().toString(36).substr(2, 9);

  socket.on('message', msg => {
    const data = JSON.parse(msg);

    // Initial registration
    if (data.type === 'register') {
      players[id] = {
        x: 100,
        y: 100,
        name: data.name || 'Player'
      };

      socket.send(JSON.stringify({ type: 'init', id, players }));
      broadcast();
      return;
    }

    // Handle movement
    if (data.type === 'move' && players[id]) {
      players[id].x = data.pos.x;
      players[id].y = data.pos.y;
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

console.log('WebSocket server running on ws://localhost:3000');

