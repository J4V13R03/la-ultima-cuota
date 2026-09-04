const cron = require('node-cron');
const Race = require('../models/Race');
const Caballo = require('../models/Caballo');
const User = require('../models/User');
const Transaccion = require('../models/Transaccion');
const Configuracion = require('../models/Configuracion');
const db = require('../config/db');

const { createBotBets } = require('./botSimulator');

const createRaceWithBots = async (offsetMinutes = 0) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const now = new Date();
    now.setMinutes(now.getMinutes() + offsetMinutes);
    const mins = now.getMinutes();
    const alignedSlot = Math.floor(mins / 10) * 10 + 10;
    const startIn = new Date(now);
    if (alignedSlot >= 60) {
      startIn.setHours(startIn.getHours() + 1);
      startIn.setMinutes(alignedSlot - 60, 0, 0);
    } else {
      startIn.setMinutes(alignedSlot, 0, 0);
    }

    const race = await Race.create({
      nombre: null,
      fecha_programada: startIn.toISOString(),
      cupo_maximo: 12,
    }, client);

    const numBots = Math.floor(Math.random() * 4) + 6;
    const botHorses = await Caballo.findBotHorsesForRace([], numBots);

    let carril = 1;
    for (const bot of botHorses) {
      await Race.insertInscription({
        carrera_id: race.id,
        caballo_id: bot.id,
        usuario_id: null,
        numero_carril: carril,
      }, client);
      carril++;
    }

    await client.query('COMMIT');
    console.log(`[Scheduler] Carrera #${race.id} creada con ${botHorses.length} bots para ${startIn.toLocaleTimeString('es-CL')}`);

    const allInscriptions = await Race.findInscriptions(race.id);
    await createBotBets(race.id, allInscriptions);

    return race;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Scheduler] Error creando carrera:', err.message);
    return null;
  } finally {
    client.release();
  }
};

let ioRef = null;
const activeRaces = new Map();

const TRACK_WIDTH = 800;
const HORSE_WIDTH = 40;

const startRaceSimulation = async (raceId) => {
  const inscriptions = await Race.findInscriptions(raceId);
  if (inscriptions.length === 0) return;

  const positions = {};
  inscriptions.forEach((insc) => { positions[insc.caballo_id] = 0; });

  const startTime = Date.now();
  const tick = () => {
    const elapsed = (Date.now() - startTime) / 1000;

    Object.keys(positions).forEach((key) => {
      if (positions[key] >= TRACK_WIDTH - HORSE_WIDTH) return;
      const speed = (Math.random() * 10 + 3) * 2;
      positions[key] = Math.min(positions[key] + speed, TRACK_WIDTH - HORSE_WIDTH);
    });

    if (ioRef) {
      ioRef.to(`race_${raceId}`).emit('race_positions', {
        carrera_id: raceId,
        positions,
        elapsed: Math.round(elapsed),
      });
    }

    const allFinished = Object.values(positions).every((p) => p >= TRACK_WIDTH - HORSE_WIDTH);
    if (allFinished) {
      clearInterval(intervalId);
      activeRaces.delete(raceId);
      console.log(`[Simulation] Carrera #${raceId} terminada en ${Math.round(elapsed)}s`);
    }
  };

  const intervalId = setInterval(tick, 1000);
  activeRaces.set(raceId, { intervalId, positions, startTime });
  console.log(`[Simulation] Carrera #${raceId} simulación iniciada`);
};

const getRacePositions = (raceId) => {
  const active = activeRaces.get(raceId);
  if (active) return active.positions;
  return null;
};

const fillWithBots = async (raceId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const existing = await Race.findInscriptions(raceId);
    const existingIds = existing.map((i) => i.caballo_id);
    const maxSlots = 12;
    const emptySlots = maxSlots - existing.length;
    const minBots = Math.ceil(emptySlots / 2);
    const maxBots = Math.floor(emptySlots * 3 / 4);
    const numBots = Math.floor(Math.random() * (maxBots - minBots + 1)) + minBots;
    const botHorses = await Caballo.findBotHorsesForRace(existingIds, numBots);

    let carril = existing.length + 1;
    for (const bot of botHorses) {
      await Race.insertInscription({
        carrera_id: raceId,
        caballo_id: bot.id,
        usuario_id: null,
        numero_carril: carril,
      }, client);
      carril++;
    }

    await client.query('COMMIT');
    console.log(`[Scheduler] Carrera #${raceId} rellenada con ${botHorses.length} bots`);

    const allInscriptions = await Race.findInscriptions(raceId);
    await createBotBets(raceId, allInscriptions);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`[Scheduler] Error rellenando carrera #${raceId}:`, err.message);
  } finally {
    client.release();
  }
};

const transitionRaces = async () => {
  try {
    const now = new Date();

    await db.query(
      `DELETE FROM carreras WHERE estado = 'programada' AND tiene_interaccion_humana = FALSE AND fecha_programada < $1`,
      [now]
    );

    const toStart = await db.query(
      `SELECT id FROM carreras
       WHERE estado = 'programada' AND fecha_programada <= $1`,
      [now]
    );

    for (const race of toStart.rows) {
      await Race.updateEstado(race.id, 'en_curso');
      console.log(`[Scheduler] Carrera #${race.id} iniciada`);

      startRaceSimulation(race.id);

      if (ioRef) {
        ioRef.emit('race_started', { carrera_id: race.id });
        console.log(`[Scheduler] Emitido race_started para carrera #${race.id}`);
      }
    }

    const toFinish = await db.query(
      `SELECT id, fecha_inicio_real, tiene_interaccion_humana FROM carreras
       WHERE estado = 'en_curso' AND fecha_inicio_real IS NOT NULL`
    );

    const raceDuration = await Configuracion.getNumeric('race_duration_seconds');

    for (const race of toFinish.rows) {
      const startTime = new Date(race.fecha_inicio_real);
      const elapsed = (now.getTime() - startTime.getTime()) / 1000;

      if (elapsed >= (raceDuration || 30)) {
        const existingResults = await Race.getResults(race.id);
        if (existingResults.length > 0) {
          await Race.updateEstado(race.id, 'finalizada');
          continue;
        }

        const inscriptions = await Race.findInscriptions(race.id);
        if (inscriptions.length > 0) {
          const results = simulateResults(inscriptions);
          await Race.finishRace(race.id, results, null);

          if (race.tiene_interaccion_humana) {
            const commissionPct = await Configuracion.getNumeric('owner_commission_pct');

            const pendingBets = await Race.getPendingBets(race.id);
            const winnerHorseId = results[0].caballo_id;

            const totalPool = pendingBets.reduce((sum, b) => sum + Number(b.monto), 0);
            const winnerPool = pendingBets
              .filter((b) => b.caballo_id === winnerHorseId)
              .reduce((sum, b) => sum + Number(b.monto), 0);

            let totalHumanWinnings = 0;

            for (const bet of pendingBets) {
              if (bet.usuario_id === null) {
                await db.query(
                  `UPDATE apuestas SET estado = $1 WHERE id = $2`,
                  [bet.caballo_id === winnerHorseId ? 'ganada' : 'perdida', bet.id]
                );
                continue;
              }

              const client2 = await db.getClient();
              try {
                await client2.query('BEGIN');

                if (bet.caballo_id === winnerHorseId) {
                  const winAmount = winnerPool > 0
                    ? (Number(bet.monto) * totalPool / winnerPool)
                    : 0;

                  totalHumanWinnings += winAmount;

                  await db.query(
                    `UPDATE apuestas SET estado = 'ganada', monto_ganado = $1 WHERE id = $2`,
                    [winAmount, bet.id]
                  );

                  const updatedUser = await User.updateSaldo(bet.usuario_id, winAmount, client2);

                  await Transaccion.create({
                    usuario_id: bet.usuario_id,
                    tipo: 'apuesta_ganada',
                    monto: winAmount,
                    saldo_resultante: updatedUser.saldo,
                    referencia_tabla: 'carreras',
                    referencia_id: race.id,
                  }, client2);
                } else {
                  await db.query(
                    `UPDATE apuestas SET estado = 'perdida' WHERE id = $1`,
                    [bet.id]
                  );
                }

                await client2.query('COMMIT');
              } catch (err) {
                await client2.query('ROLLBACK');
                console.error('[Settlement] Error procesando apuesta:', err.message);
              } finally {
                client2.release();
              }
            }

            const winnerInscription = inscriptions.find((i) => i.caballo_id === winnerHorseId);
            if (winnerInscription && winnerInscription.usuario_id) {
              const commission = totalHumanWinnings * (commissionPct || 10) / 100;

              if (commission > 0) {
                const ownerClient = await db.getClient();
                try {
                  await ownerClient.query('BEGIN');
                  const updatedOwner = await User.updateSaldo(winnerInscription.usuario_id, commission, ownerClient);
                  await Transaccion.create({
                    usuario_id: winnerInscription.usuario_id,
                    tipo: 'comision_dueno',
                    monto: commission,
                    saldo_resultante: updatedOwner.saldo,
                    referencia_tabla: 'carreras',
                    referencia_id: race.id,
                  }, ownerClient);
                  await ownerClient.query('COMMIT');
                } catch (err) {
                  await ownerClient.query('ROLLBACK');
                  console.error('[Settlement] Error pagando comision:', err.message);
                } finally {
                  ownerClient.release();
                }
              }
            }

            for (const r of results) {
              const wins = r.posicion === 1 ? 1 : 0;
              await Caballo.incrementStats(r.caballo_id, wins, 1, r.posicion);
            }

            await Race.updateEstado(race.id, 'finalizada');
            console.log(`[Scheduler] Carrera #${race.id} finalizada`);
          } else {
            await Race.deleteRace(race.id);
            console.log(`[Scheduler] Carrera #${race.id} eliminada (solo bots)`);
          }
        } else {
          await Race.deleteRace(race.id);
          console.log(`[Scheduler] Carrera #${race.id} eliminada (sin inscripciones)`);
        }
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error en transiciones:', err.message);
  }
};

const simulateResults = (inscriptions) => {
  const results = inscriptions.map((insc) => {
    const velocidad = insc.velocidad || 50;
    const resistencia = insc.resistencia || 50;
    const corazon = insc.corazon || 50;
    const score = (velocidad * 0.5 + resistencia * 0.3 + corazon * 0.2) + Math.random() * 30;

    return {
      caballo_id: insc.caballo_id,
      posicion: 0,
      tiempo: 0,
      score,
    };
  });

  results.sort((a, b) => b.score - a.score);

  const baseTime = 24;
  const timeSpread = 6;
  results.forEach((r, idx) => {
    r.posicion = idx + 1;
    r.tiempo = (baseTime + (idx * timeSpread / results.length) + Math.random() * 1.5).toFixed(2);
  });

  return results;
};

const startScheduler = async (socketIo) => {
  ioRef = socketIo;
  try {
    await db.query(
      `DELETE FROM carreras WHERE estado = 'programada' AND tiene_interaccion_humana = FALSE`
    );

    const existing = await db.query(
      `SELECT id FROM carreras WHERE estado IN ('programada','en_curso')`
    );
    const need = Math.max(0, 4 - existing.rows.length);
    for (let i = 0; i < need; i++) {
      await createRaceWithBots(i * 10);
    }

    cron.schedule('*/1 * * * *', async () => {
      const m = new Date().getMinutes();
      if (m % 10 !== 0) return;

      const count = await db.query(
        `SELECT COUNT(*)::int AS cnt FROM carreras WHERE estado = 'programada'`
      );
      if (count.rows[0].cnt < 4) {
        const toCreate = 4 - count.rows[0].cnt;
        for (let i = 0; i < toCreate; i++) {
          await createRaceWithBots(i * 10);
        }
      }
    });

    cron.schedule('* * * * *', async () => {
      await transitionRaces();
    });

    console.log(`[Scheduler] Iniciado — carreras cada 10 min en punto, mínimo 4 programadas`);
  } catch (err) {
    console.error('[Scheduler] Error al iniciar:', err.message);
  }
};

module.exports = { startScheduler, createRaceWithBots, transitionRaces, getRacePositions };
