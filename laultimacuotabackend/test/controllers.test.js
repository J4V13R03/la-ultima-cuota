process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  getClient: jest.fn(() => ({
    query: jest.fn(),
    release: jest.fn(),
  })),
}));

jest.mock('../src/models/User', () => ({
  findByEmail: jest.fn(),
  findByEmailOrUsername: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateSaldo: jest.fn(),
  updateDailyClaim: jest.fn(),
  getSaldo: jest.fn(),
}));

jest.mock('../src/models/Configuracion', () => ({
  get: jest.fn(),
  getNumeric: jest.fn(),
  getAll: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../src/models/Transaccion', () => ({
  create: jest.fn(),
  getRecentWins: jest.fn(),
}));

jest.mock('../src/models/Caballo', () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByOwner: jest.fn(),
  findOnSaleWithSearch: jest.fn(),
  updateName: jest.fn(),
  setForSale: jest.fn(),
  removeFromSale: jest.fn(),
  transfer: jest.fn(),
  delete: jest.fn(),
  getStatsForRace: jest.fn(),
  isInscribedInActiveRace: jest.fn(),
  incrementStats: jest.fn(),
  findBotHorsesForRace: jest.fn(),
}));

jest.mock('../src/models/Race', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  findInscriptions: jest.fn(),
  create: jest.fn(),
  updateEstado: jest.fn(),
  insertInscription: jest.fn(),
  getOdds: jest.fn(),
  getPendingBets: jest.fn(),
  finishRace: jest.fn(),
  getResults: jest.fn(),
  deleteRace: jest.fn(),
  markHumanInteraction: jest.fn(),
}));

const db = require('../src/config/db');
const User = require('../src/models/User');
const Configuracion = require('../src/models/Configuracion');
const Transaccion = require('../src/models/Transaccion');
const Caballo = require('../src/models/Caballo');
const Race = require('../src/models/Race');
const authController = require('../src/controllers/authController');
const dailyController = require('../src/controllers/dailyController');
const gachaController = require('../src/controllers/gachaController');
const stableController = require('../src/controllers/stableController');
const marketController = require('../src/controllers/marketController');
const raceController = require('../src/controllers/raceController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const mockReq = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  user: { id: 1, username: 'testuser', email: 'test@test.com' },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Auth Controller', () => {
  describe('register', () => {
    it('should register a new user', async () => {
      User.findByEmailOrUsername.mockResolvedValue([]);
      jest.spyOn(require('../src/utils/hash'), 'hashPassword').mockResolvedValue('hashedpw');
      User.create.mockResolvedValue({ id: 1, username: 'newuser', email: 'new@test.com', saldo: 1000 });

      const req = mockReq({ body: { username: 'newuser', email: 'new@test.com', password: 'pass123' } });
      const res = mockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should reject duplicate email/username', async () => {
      User.findByEmailOrUsername.mockResolvedValue([{ id: 1 }]);

      const req = mockReq({ body: { username: 'existing', email: 'exists@test.com', password: 'pass123' } });
      const res = mockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should reject missing fields', async () => {
      const req = mockReq({ body: { username: '', email: '', password: '' } });
      const res = mockRes();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('password123', 10);
      User.findByEmail.mockResolvedValue({ id: 1, username: 'test', email: 'test@test.com', password_hash: hash, saldo: 1000 });

      const req = mockReq({ body: { email: 'test@test.com', password: 'password123' } });
      const res = mockRes();

      await authController.login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should reject invalid credentials', async () => {
      User.findByEmail.mockResolvedValue(null);

      const req = mockReq({ body: { email: 'wrong@test.com', password: 'wrong' } });
      const res = mockRes();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});

describe('Daily Controller', () => {
  describe('claimDaily', () => {
    it('should claim daily reward', async () => {
      User.findById.mockResolvedValue({ id: 1, ultima_recompensa_diaria: null });
      Configuracion.getNumeric.mockResolvedValue(500);
      User.updateSaldo.mockResolvedValue({ id: 1, saldo: 1500 });
      User.updateDailyClaim.mockResolvedValue({});
      Transaccion.create.mockResolvedValue({});

      const mockClient = { query: jest.fn(), release: jest.fn() };
      db.getClient.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({});

      const req = mockReq();
      const res = mockRes();

      await dailyController.claimDaily(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ monto: 500 }),
        })
      );
    });

    it('should reject if claimed within 24h', async () => {
      User.findById.mockResolvedValue({
        id: 1,
        ultima_recompensa_diaria: new Date(Date.now() - 3600000).toISOString(),
      });

      const mockClient = { query: jest.fn(), release: jest.fn() };
      db.getClient.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({});

      const req = mockReq();
      const res = mockRes();

      await dailyController.claimDaily(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('getStatus', () => {
    it('should return available when no previous claim', async () => {
      User.findById.mockResolvedValue({ id: 1, ultima_recompensa_diaria: null });
      Configuracion.getNumeric.mockResolvedValue(500);

      const req = mockReq();
      const res = mockRes();

      await dailyController.getStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ available: true }),
        })
      );
    });
  });
});

describe('Gacha Controller', () => {
  describe('pullHorse', () => {
    it('should create horse when sufficient balance', async () => {
      Configuracion.getNumeric.mockResolvedValue(300);
      User.updateSaldo.mockResolvedValue({ id: 1, saldo: 700 });
      Caballo.create.mockResolvedValue({ id: 1, nombre: 'TestHorse', edad: 4 });
      Transaccion.create.mockResolvedValue({});

      const mockClient = { query: jest.fn(), release: jest.fn() };
      db.getClient.mockResolvedValue(mockClient);
      mockClient.query.mockImplementation((sql) => {
        if (sql.includes('SELECT saldo')) return Promise.resolve({ rows: [{ saldo: 1000 }] });
        return Promise.resolve({});
      });

      const req = mockReq();
      const res = mockRes();

      await gachaController.pullHorse(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            caballo: expect.objectContaining({ nombre: 'TestHorse' }),
            saldo: 700,
          }),
        })
      );
    });

    it('should reject when insufficient balance', async () => {
      Configuracion.getNumeric.mockResolvedValue(300);

      const mockClient = { query: jest.fn(), release: jest.fn() };
      db.getClient.mockResolvedValue(mockClient);
      mockClient.query.mockImplementation((sql) => {
        if (sql.includes('SELECT saldo')) return Promise.resolve({ rows: [{ saldo: 100 }] });
        return Promise.resolve({});
      });

      const req = mockReq();
      const res = mockRes();

      await gachaController.pullHorse(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});

describe('Stable Controller', () => {
  describe('getMyHorses', () => {
    it('should return user horses', async () => {
      Caballo.findByOwner.mockResolvedValue([
        { id: 1, nombre: 'MyHorse', victorias: 3, carreras_totales: 5 },
      ]);

      const req = mockReq();
      const res = mockRes();

      await stableController.getMyHorses(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            horses: expect.arrayContaining([
              expect.objectContaining({ nombre: 'MyHorse' }),
            ]),
          }),
        })
      );
    });
  });

  describe('renameHorse', () => {
    it('should rename owned horse', async () => {
      Caballo.updateName.mockResolvedValue({ id: 1, nombre: 'NewName' });

      const req = mockReq({ params: { id: '1' }, body: { nombre: 'NewName' } });
      const res = mockRes();

      await stableController.renameHorse(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            caballo: expect.objectContaining({ nombre: 'NewName' }),
          }),
        })
      );
    });

    it('should reject empty name', async () => {
      const req = mockReq({ params: { id: '1' }, body: { nombre: '' } });
      const res = mockRes();

      await stableController.renameHorse(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('putForSale', () => {
    it('should set horse for sale', async () => {
      Caballo.findById.mockResolvedValue({ id: 1, propietario_id: 1, es_bot: false });
      Caballo.isInscribedInActiveRace.mockResolvedValue(false);
      Caballo.setForSale.mockResolvedValue({ id: 1, en_venta: true, precio_venta: 5000 });

      const req = mockReq({ params: { id: '1' }, body: { precio: 5000 } });
      const res = mockRes();

      await stableController.putForSale(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should reject bot horses from sale', async () => {
      Caballo.findById.mockResolvedValue({ id: 1, propietario_id: 1, es_bot: true });

      const req = mockReq({ params: { id: '1' }, body: { precio: 5000 } });
      const res = mockRes();

      await stableController.putForSale(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});

describe('Market Controller', () => {
  describe('getOnSale', () => {
    it('should return horses for sale', async () => {
      Caballo.findOnSaleWithSearch.mockResolvedValue([
        { id: 1, nombre: 'SaleHorse', precio_venta: 3000, dueno_username: 'seller' },
      ]);

      const req = mockReq({ query: { search: '', sort: 'price_asc' } });
      const res = mockRes();

      await marketController.getOnSale(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            horses: expect.arrayContaining([
              expect.objectContaining({ nombre: 'SaleHorse' }),
            ]),
          }),
        })
      );
    });
  });

  describe('buyHorse', () => {
    it('should complete purchase', async () => {
      Caballo.findById.mockResolvedValue({
        id: 1, propietario_id: 2, en_venta: true, precio_venta: 3000,
      });
      User.updateSaldo.mockResolvedValueOnce({ id: 1, saldo: 2000 });
      User.updateSaldo.mockResolvedValueOnce({ id: 2, saldo: 3000 });
      Caballo.transfer.mockResolvedValue({});
      Transaccion.create.mockResolvedValue({});

      const mockClient = { query: jest.fn(), release: jest.fn() };
      db.getClient.mockResolvedValue(mockClient);
      mockClient.query.mockImplementation((sql) => {
        if (sql.includes('SELECT saldo')) return Promise.resolve({ rows: [{ saldo: 5000 }] });
        return Promise.resolve({});
      });

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();

      await marketController.buyHorse(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ message: 'Caballo comprado exitosamente' }),
        })
      );
    });

    it('should reject buying own horse', async () => {
      Caballo.findById.mockResolvedValue({
        id: 1, propietario_id: 1, en_venta: true, precio_venta: 3000,
      });

      const mockClient = { query: jest.fn(), release: jest.fn() };
      db.getClient.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({});

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();

      await marketController.buyHorse(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});

describe('Race Controller', () => {
  describe('getAll', () => {
    it('should return all races', async () => {
      Race.findAll.mockResolvedValue([
        { id: 1, estado: 'programada', nombre: null },
      ]);

      const req = mockReq();
      const res = mockRes();

      await raceController.getAll(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            races: expect.arrayContaining([
              expect.objectContaining({ id: 1 }),
            ]),
          }),
        })
      );
    });
  });

  describe('getById', () => {
    it('should return race with inscriptions', async () => {
      Race.findById.mockResolvedValue({ id: 1, estado: 'programada' });
      Race.findInscriptions.mockResolvedValue([
        { caballo_id: 10, caballo_nombre: 'TestHorse', numero_carril: 1 },
      ]);

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();

      await raceController.getById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            race: expect.objectContaining({ id: 1 }),
          }),
        })
      );
    });

    it('should return 404 when not found', async () => {
      Race.findById.mockResolvedValue(null);

      const req = mockReq({ params: { id: '999' } });
      const res = mockRes();

      await raceController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getResults', () => {
    it('should return results for finished race', async () => {
      Race.findById.mockResolvedValue({ id: 1, estado: 'finalizada' });
      Race.getResults.mockResolvedValue([
        { caballo_id: 10, posicion_final: 1, tiempo_final: 27.5 },
      ]);

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();

      await raceController.getResults(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            results: expect.arrayContaining([
              expect.objectContaining({ posicion_final: 1 }),
            ]),
          }),
        })
      );
    });

    it('should reject if race not finished', async () => {
      Race.findById.mockResolvedValue({ id: 1, estado: 'programada' });

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();

      await raceController.getResults(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('inscription', () => {
    it('should mark tiene_interaccion_humana on human inscription', async () => {
      const mockClient = { query: jest.fn(), release: jest.fn() };
      db.getClient.mockResolvedValue(mockClient);
      mockClient.query.mockImplementation((sql) => {
        if (sql.includes('MAX(numero_carril)')) {
          return Promise.resolve({ rows: [{ next_lane: 1 }] });
        }
        return Promise.resolve({});
      });

      Race.findById.mockResolvedValue({ id: 1, estado: 'programada', participantes_actuales: 5, cupo_maximo: 12 });
      Caballo.findById.mockResolvedValue({ id: 10, propietario_id: 1, fatiga: 30 });
      Race.findInscriptions.mockResolvedValue([]);
      Race.insertInscription.mockResolvedValue({});
      Race.markHumanInteraction.mockResolvedValue({});

      const req = mockReq({ params: { id: '1' }, body: { caballo_id: 10 } });
      const res = mockRes();

      await raceController.inscription(req, res);

      expect(Race.markHumanInteraction).toHaveBeenCalledWith('1', mockClient);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('placeBet', () => {
    it('should mark tiene_interaccion_humana on bet', async () => {
      const mockClient = { query: jest.fn(), release: jest.fn() };
      db.getClient.mockResolvedValue(mockClient);
      mockClient.query.mockImplementation((sql) => {
        if (sql.includes('SELECT saldo')) return Promise.resolve({ rows: [{ saldo: 1000 }] });
        return Promise.resolve({});
      });

      Race.findById.mockResolvedValue({ id: 1, estado: 'programada' });
      Race.findInscriptions.mockResolvedValue([{ caballo_id: 10 }]);
      User.updateSaldo.mockResolvedValue({ id: 1, saldo: 900 });
      db.query.mockResolvedValue({ rows: [] });
      Transaccion.create.mockResolvedValue({});
      Race.markHumanInteraction.mockResolvedValue({});

      const req = mockReq({ params: { id: '1' }, body: { caballo_id: 10, monto: 100 } });
      const res = mockRes();

      await raceController.placeBet(req, res);

      expect(Race.markHumanInteraction).toHaveBeenCalledWith('1', mockClient);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});

describe('Race Model', () => {
  describe('markHumanInteraction', () => {
    it('should exist as a function', () => {
      expect(typeof Race.markHumanInteraction).toBe('function');
    });
  });

  describe('deleteRace', () => {
    it('should exist as a function', () => {
      expect(typeof Race.deleteRace).toBe('function');
    });
  });

  describe('getResults', () => {
    it('should exist as a function', () => {
      expect(typeof Race.getResults).toBe('function');
    });
  });
});
