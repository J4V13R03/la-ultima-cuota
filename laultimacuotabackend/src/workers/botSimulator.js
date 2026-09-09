const db = require('../config/db');

const calculateWinrate = (horse) => {
  const velocidad = horse.velocidad || 50;
  const resistencia = horse.resistencia || 50;
  const corazon = horse.corazon || 50;
  return (velocidad * 0.5 + resistencia * 0.3 + corazon * 0.2) / 100;
};

const generateBotBets = (horse, raceId, totalPool, allHorses) => {
  const winrate = calculateWinrate(horse);
  const bets = [];

  const numBets = Math.floor(Math.random() * 4) + 1;
  for (let i = 0; i < numBets; i++) {
    const botPoolShare = totalPool > 0 ? totalPool * (0.05 + Math.random() * 0.2) : 100;
    const minBet = Math.max(50, Math.floor(botPoolShare * 0.1));
    const maxBet = Math.floor(botPoolShare * 0.6);
    const monto = Math.floor(Math.random() * (maxBet - minBet + 1)) + minBet;

    const preferStronger = Math.random() < 0.6;
    if (preferStronger && winrate < 0.4) {
      continue;
    }

    const cuota = '1.00';

    bets.push({
      usuario_id: null,
      carrera_id: raceId,
      caballo_id: horse.caballo_id,
      monto,
      cuota,
      estado: 'pendiente',
    });
  }

  return bets;
};

const createBotBets = async (raceId, inscriptions) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const botHorses = inscriptions.filter((i) => i.es_bot);
    const humanHorses = inscriptions.filter((i) => !i.es_bot);

    let totalPool = 0;
    const allBotBets = [];

    for (const bot of botHorses) {
      const botBets = generateBotBets(bot, raceId, totalPool, inscriptions);
      allBotBets.push(...botBets);
      totalPool += botBets.reduce((sum, b) => sum + b.monto, 0);
    }

    for (const bet of allBotBets) {
      await client.query(
        `INSERT INTO apuestas (usuario_id, carrera_id, caballo_id, monto, cuota, estado)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [bet.usuario_id, bet.carrera_id, bet.caballo_id, bet.monto, bet.cuota, bet.estado]
      );
    }

    await client.query('COMMIT');
    console.log(`[BotSim] Carrera #${raceId}: ${allBotBets.length} apuestas de bots creadas, pool total: $${totalPool}`);
    return allBotBets;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`[BotSim] Error creando apuestas bots carrera #${raceId}:`, err.message);
    return [];
  } finally {
    client.release();
  }
};

module.exports = { calculateWinrate, generateBotBets, createBotBets };
