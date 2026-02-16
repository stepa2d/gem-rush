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
const genId = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const pubGame = g => ({
  id: g.id, maxPlayers: g.maxPlayers, currentPlayers: g.players.length,
  fee: g.fee, status: g.status, createdAt: g.createdAt
});

function broadcastList() {
  const list = [...games.values()].filter(g => g.status === 'waiting').map(pubGame);
  io.emit('games_list', list);
}

function startGame(id) {
  const g = games.get(id);
  if (!g) return;
  g.status = 'playing';
  g.seed = Math.floor(Math.random() * 2147483647);
  g.scores = g.players.map(() => 0);
  g.startTime = Date.now();
  g.players.forEach((p, i) => {
    const s = io.sockets.sockets.get(p.id);
    if (s) s.emit('game_start', {
      gameId: g.id, seed: g.seed, playerIndex: i,
      playerCount: g.players.length,
      players: g.players.map(pl => ({ name: pl.name, index: pl.index }))
    });
  });
  g.timer = setTimeout(() => {
    if (games.has(id) && g.status === 'playing') endGame(id, 'time');
  }, 76000);
  broadcastList();
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
  broadcastList();
}

// Cleanup stale waiting games every 60s
setInterval(() => {
  const now = Date.now();
  for (const [id, g] of games) {
    if (g.status === 'waiting' && now - g.createdAt > 300000) {
      g.players.forEach(p => {
        const s = io.sockets.sockets.get(p.id);
        if (s) { s.emit('game_expired'); s.data.gameId = null; }
      });
      games.delete(id);
    }
  }
  broadcastList();
}, 60000);

io.on('connection', (socket) => {
  const list = [...games.values()].filter(g => g.status === 'waiting').map(pubGame);
  socket.emit('games_list', list);

  socket.on('create_game', ({ maxPlayers, fee }) => {
    const id = genId();
    const g = {
      id, maxPlayers: Math.max(2, Math.min(4, maxPlayers || 2)),
      fee: fee || 0, status: 'waiting',
      players: [{ id: socket.id, index: 0, name: 'Игрок 1' }],
      scores: [], seed: null, timer: null, createdAt: Date.now()
    };
    games.set(id, g);
    socket.data.gameId = id;
    socket.data.playerIndex = 0;
    socket.join(id);
    socket.emit('game_created', { gameId: id, game: pubGame(g) });
    broadcastList();
  });

  socket.on('list_games', () => {
    socket.emit('games_list', [...games.values()].filter(g => g.status === 'waiting').map(pubGame));
  });

  socket.on('join_game', ({ gameId }) => {
    const g = games.get(gameId);
    if (!g || g.status !== 'waiting') return socket.emit('join_error', { message: 'Игра не найдена' });
    if (g.players.length >= g.maxPlayers) return socket.emit('join_error', { message: 'Игра заполнена' });
    if (g.players.find(p => p.id === socket.id)) return socket.emit('join_error', { message: 'Вы уже в игре' });

    const pi = g.players.length;
    g.players.push({ id: socket.id, index: pi, name: `Игрок ${pi + 1}` });
    socket.data.gameId = gameId;
    socket.data.playerIndex = pi;
    socket.join(gameId);
    io.to(gameId).emit('player_joined', { currentPlayers: g.players.length, maxPlayers: g.maxPlayers });
    if (g.players.length >= g.maxPlayers) startGame(gameId);
    broadcastList();
  });

  socket.on('leave_game', () => {
    const gid = socket.data.gameId;
    if (!gid || !games.has(gid)) return;
    const g = games.get(gid);
    if (g.status === 'waiting') {
      g.players = g.players.filter(p => p.id !== socket.id);
      socket.leave(gid); socket.data.gameId = null;
      if (g.players.length === 0) games.delete(gid);
      else io.to(gid).emit('player_left', { currentPlayers: g.players.length, maxPlayers: g.maxPlayers });
      broadcastList();
    } else if (g.status === 'playing') {
      io.to(gid).emit('player_disconnected', { playerIndex: socket.data.playerIndex });
      endGame(gid, 'disconnect');
    }
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

  socket.on('disconnect', () => {
    const gid = socket.data.gameId;
    if (!gid || !games.has(gid)) return;
    const g = games.get(gid);
    if (g.status === 'waiting') {
      g.players = g.players.filter(p => p.id !== socket.id);
      if (g.players.length === 0) games.delete(gid);
      broadcastList();
    } else if (g.status === 'playing') {
      io.to(gid).emit('player_disconnected', { playerIndex: socket.data.playerIndex });
      endGame(gid, 'disconnect');
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Gem Rush server on port ${PORT}`));
