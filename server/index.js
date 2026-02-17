import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(join(__dirname, '../dist')));
app.get('/{*path}', (req, res) => res.sendFile(join(__dirname, '../dist/index.html')));

const games = new Map();
const queue = []; // waiting players [{id, name}]
let onlineCount = 0;

function startGame(players) {
  const id = Math.random().toString(36).slice(2, 8).toUpperCase();
  const g = {
    id, status: 'playing',
    players: players.map((p, i) => ({ id: p.id, index: i, name: p.name })),
    scores: players.map(() => 0),
    seed: Math.floor(Math.random() * 2147483647),
    timer: null, startTime: Date.now()
  };
  games.set(id, g);
  g.players.forEach((p, i) => {
    const s = io.sockets.sockets.get(p.id);
    if (s) {
      s.data.gameId = id;
      s.data.playerIndex = i;
      s.join(id);
      s.emit('game_start', {
        gameId: id, seed: g.seed, playerIndex: i,
        playerCount: g.players.length,
        players: g.players.map(pl => ({ name: pl.name, index: pl.index }))
      });
    }
  });
  g.timer = setTimeout(() => {
    if (games.has(id) && g.status === 'playing') endGame(id, 'time');
  }, 76000);
}

function endGame(id, reason) {
  const g = games.get(id);
  if (!g || g.status === 'finished') return;
  g.status = 'finished';
  if (g.timer) clearTimeout(g.timer);
  let winner = -1, max = -1;
  g.scores.forEach((s, i) => { if (s > max) { max = s; winner = i; } });
  g.players.forEach(p => {
    const s = io.sockets.sockets.get(p.id);
    if (s) {
      s.emit('game_over', { winner, scores: g.scores, reason,
        players: g.players.map(pl => ({ name: pl.name, index: pl.index })) });
      s.data.gameId = null;
    }
  });
  setTimeout(() => games.delete(id), 10000);
}

function removeFromQueue(socketId) {
  const idx = queue.findIndex(p => p.id === socketId);
  if (idx !== -1) queue.splice(idx, 1);
}

function tryMatch() {
  while (queue.length >= 2) {
    const p1 = queue.shift();
    const p2 = queue.shift();
    // Verify both still connected
    const s1 = io.sockets.sockets.get(p1.id);
    const s2 = io.sockets.sockets.get(p2.id);
    if (!s1 && !s2) continue;
    if (!s1) { queue.unshift(p2); continue; }
    if (!s2) { queue.unshift(p1); continue; }
    startGame([p1, p2]);
  }
}

io.on('connection', (socket) => {
  onlineCount++;
  io.emit('online_count', onlineCount);
  socket.emit('online_count', onlineCount);

  socket.on('find_match', ({ name }) => {
    if (queue.find(p => p.id === socket.id)) return;
    if (socket.data.gameId) return;
    queue.push({ id: socket.id, name: (name || 'Гость').slice(0, 16) });
    socket.emit('searching');
    tryMatch();
  });

  socket.on('cancel_match', () => {
    removeFromQueue(socket.id);
  });

  socket.on('emote', ({ emoji }) => {
    const gid = socket.data.gameId, pi = socket.data.playerIndex;
    if (!gid || pi === undefined) return;
    io.to(gid).emit('emote', { playerIndex: pi, emoji: String(emoji).slice(0, 4) });
  });

  socket.on('score_update', ({ score }) => {
    const gid = socket.data.gameId, pi = socket.data.playerIndex;
    if (!gid || pi === undefined || !games.has(gid)) return;
    const g = games.get(gid);
    if (g.status !== 'playing') return;
    g.scores[pi] = score;
    io.to(gid).emit('scores_update', { scores: g.scores });
    if (score >= 1000) endGame(gid, 'target');
  });

  socket.on('leave_game', () => {
    removeFromQueue(socket.id);
    const gid = socket.data.gameId;
    if (!gid || !games.has(gid)) return;
    const g = games.get(gid);
    if (g.status === 'playing') {
      io.to(gid).emit('player_disconnected', { playerIndex: socket.data.playerIndex });
      endGame(gid, 'disconnect');
    }
  });

  socket.on('disconnect', () => {
    onlineCount = Math.max(0, onlineCount - 1);
    io.emit('online_count', onlineCount);
    removeFromQueue(socket.id);
    const gid = socket.data.gameId;
    if (!gid || !games.has(gid)) return;
    const g = games.get(gid);
    if (g.status === 'playing') {
      io.to(gid).emit('player_disconnected', { playerIndex: socket.data.playerIndex });
      endGame(gid, 'disconnect');
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Gem Rush server on port ${PORT}`));
