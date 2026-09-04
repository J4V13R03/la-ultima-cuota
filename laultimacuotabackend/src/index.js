require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { testConnection } = require('./config/db');
const authRoutes = require('./routes/auth');
const raceRoutes = require('./routes/race');
const dailyRoutes = require('./routes/daily');
const gachaRoutes = require('./routes/gacha');
const stableRoutes = require('./routes/stable');
const marketRoutes = require('./routes/market');
const historyRoutes = require('./routes/history');
const { startScheduler, getRacePositions } = require('./workers/raceScheduler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/auth', authRoutes);
app.use('/api/races', raceRoutes);
app.use('/api/daily', dailyRoutes);
app.use('/api/gacha', gachaRoutes);
app.use('/api/stable', stableRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/history', historyRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

io.on('connection', (socket) => {
  console.log(`[Socket] Cliente conectado: ${socket.id}`);

  socket.on('join_race', (raceId) => {
    socket.join(`race_${raceId}`);
    const positions = getRacePositions(raceId);
    if (positions) {
      socket.emit('race_positions', { carrera_id: raceId, positions, elapsed: 0 });
    }
  });

  socket.on('leave_race', (raceId) => {
    socket.leave(`race_${raceId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Cliente desconectado: ${socket.id}`);
  });
});

app.set('io', io);

const start = async () => {
  await testConnection();
  startScheduler(io);
  server.listen(PORT, () => {
    console.log(`[Server] Puerto ${PORT}`);
  });
};

start().catch((err) => {
  console.error('[Server] Error al iniciar:', err.message);
  process.exit(1);
});
