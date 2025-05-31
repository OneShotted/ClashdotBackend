const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3000 });

let players = {};
let idCounter = 0;

wss.on('connection', (ws) => {
  const playerId = `player_${idCounter++}`;
  players[playerId] = {
    id: playerId,
    x: 1000,
    y: 1000,
    name: `Player${idCounter}`,
    ws: ws,
  };

  // Send the ID back to the client
  ws.send(JSON.stringify({ type: 'id', id: playerId }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'register') {
        if (players[playerId]) {
          players[playerId].name = data.name;
        }

      } else if (data.type === 'move') {
        const speed = 5;
        if (!players[playerId]) return;

        if (data.key === 'ArrowUp') players[playerId].y -= speed;
        if (data.key === 'ArrowDown') players[playerId].y += speed;
        if (data.key === 'ArrowLeft') players[playerId].x -= speed;
        if (data.key === 'ArrowRight') players[playerId].x += speed;

      } else if (data.type === 'chat') {
        // Broadcast chat to all players
        const chatPayload = JSON.stringify({
          type: 'chat',
          name: players[playerId]?.name || 'Unknown',
          message: data.message
        });

        for (const id in players) {
          players[id].ws.send(chatPayload);
        }
      }

      // Broadcast updated players list (excluding WebSocket reference)
      const broadcastData = {
        type: 'update',
        players: {},
      };

      for (const id in players) {
        broadcastData.players[id] = {
          x: players[id].x,
          y: players[id].y,
          name: players[id].name,
        };
      }

      const payload = JSON.stringify(broadcastData);

      for (const id in players) {
        players[id].ws.send(payload);
      }

    } catch (e) {
      console.error('Invalid message received:', message);
    }
  });

  ws.on('close', () => {
    delete players[playerId];
  });
});

console.log('WebSocket server running on ws://localhost:3000');


