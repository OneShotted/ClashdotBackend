const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ port: 8080 });
const players = {};
const sockets = {};

console.log('Server started on port 8080');

wss.on('connection', (ws) => {
  const id = uuidv4();
  sockets[id] = ws;

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (err) {
      console.error('Invalid JSON:', message);
      return;
    }

    if (data.type === 'register') {
      let name = data.name;
      let isDev = false;
      if (name.includes('#1627')) {
        isDev = true;
        name = name.replace('#1627', '');
      }

      players[id] = {
        id,
        name,
        //x: Math.random() * 1000,
        //y: Math.random() * 1000,
        x: 0,
        y: 0,
        isDev
      };

      ws.send(JSON.stringify({ type: 'id', id }));
      broadcastState();
    }
    else if (data.type === 'leaveGame') {
      delete players[id];
      delete sockets[id];
      broadcastState();
    }
    else if (data.type === 'movementState') {
      if (!players[id]) return;

      const speed = players[id].isDev ? 5 : 2; // ✅ Speed boost for devs
      const keys = data.keys || {};

      if (keys.up) players[id].y -= speed;
      if (keys.down) players[id].y += speed;
      if (keys.left) players[id].x -= speed;
      if (keys.right) players[id].x += speed;

      broadcastState();
    }

    else if (data.type === 'chat') {
      const player = players[id];
      if (!player) return;
      const messageToSend = {
        type: 'chat',
        name: player.name,
        message: data.message,
        isBroadcast: false
      };
      broadcast(messageToSend);
    }

    else if (data.type === 'devCommand') {
      const player = players[id];
      if (!player || !player.isDev) return;

      if (data.command === 'kick') {
        const targetId = data.targetId;
        if (players[targetId] && sockets[targetId]) {
          // Notify the target before closing
          sockets[targetId].send(JSON.stringify({
            type: 'kicked',
            reason: 'You were kicked by a developer.'
          }));

          // Close the socket with a custom code
          sockets[targetId].close(4000, 'Kicked by developer');

          // Cleanup
          delete players[targetId];
          delete sockets[targetId];

          broadcastState();
        }
      }

      else if (data.command === 'teleport') {
        const targetId = data.targetId;
        const x = data.x || 0;
        const y = data.y || 0;
        if (players[targetId]) {
          players[targetId].x = x;
          players[targetId].y = y;
          broadcastState();
        }
      }

      else if (data.command === 'broadcast') {
        const message = data.message || '';
        const broadcastMessage = {
          type: 'chat',
          message: `[Broadcast] ${message}`,
          isBroadcast: true
        };
        broadcast(broadcastMessage);
      }
    }
  });

  ws.on('close', () => {
    delete players[id];
    delete sockets[id];
    broadcastState();
  });
});

function broadcastState() {
  const state = {
    type: 'update',
    players
  };
  broadcast(state);
}

function broadcast(data) {
  const msg = JSON.stringify(data);
  Object.values(sockets).forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}


