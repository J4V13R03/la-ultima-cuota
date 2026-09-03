require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');
const authRoutes = require('./routes/auth');
const raceRoutes = require('./routes/race');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/auth', authRoutes);
app.use('/api/races', raceRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

const start = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`[Server] Puerto ${PORT}`);
  });
};

start().catch((err) => {
  console.error('[Server] Error al iniciar:', err.message);
  process.exit(1);
});
