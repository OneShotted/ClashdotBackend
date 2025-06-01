function createMob(type) {
  const size = 20 * 0.75;
  return {
    id: Math.random().toString(36).substr(2, 9),
    type,
    x: Math.random() * 1000,
    y: Math.random() * 1000,
    size,
    speed: type === 'wanderer' ? 2 : 3,
    color: type === 'wanderer' ? 'yellow' : 'orange',
  };
}

function updateMobs(mobs, players) {
  for (const mob of mobs) {
    if (mob.type === 'wanderer') {
      // Move in random direction
      mob.x += (Math.random() - 0.5) * mob.speed;
      mob.y += (Math.random() - 0.5) * mob.speed;
    } else if (mob.type === 'chaser') {
      // Move toward closest player
      const nearest = getNearestPlayer(mob, players);
      if (nearest) {
        const dx = nearest.x - mob.x;
        const dy = nearest.y - mob.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          mob.x += (dx / dist) * mob.speed;
          mob.y += (dy / dist) * mob.speed;
        }
      }
    }
  }
}

function getNearestPlayer(mob, players) {
  let nearest = null;
  let nearestDist = Infinity;

  for (const id in players) {
    const player = players[id];
    const dx = player.x - mob.x;
    const dy = player.y - mob.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = player;
    }
  }

  return nearest;
}

function handleMobCollisions(mobs, players) {
  for (const id in players) {
    const player = players[id];

    for (const mob of mobs) {
      const dx = player.x - mob.x;
      const dy = player.y - mob.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const collisionDist = 20 + mob.size;

      if (distance < collisionDist) {
        player.health = Math.max(player.health - 5, 0);
      }
    }
  }
}

module.exports = {
  createMob,
  updateMobs,
  handleMobCollisions,
};
