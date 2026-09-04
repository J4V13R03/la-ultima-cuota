const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

const User = require('../src/models/User');
const { hashPassword, comparePassword } = require('../src/utils/hash');

jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}));

const db = require('../src/config/db');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('User Model', () => {
  describe('findByEmail', () => {
    it('should return user when found', async () => {
      const mockUser = { id: 1, username: 'test', email: 'test@test.com', saldo: 1000 };
      db.query.mockResolvedValue({ rows: [mockUser] });

      const result = await User.findByEmail('test@test.com');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, username, email'),
        ['test@test.com']
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null when not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await User.findByEmail('notfound@test.com');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return new user', async () => {
      const mockUser = { id: 1, username: 'newuser', email: 'new@test.com', saldo: 1000 };
      db.query.mockResolvedValue({ rows: [mockUser] });

      const result = await User.create({
        username: 'newuser',
        email: 'new@test.com',
        password_hash: 'hashedpassword',
      });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO usuarios'),
        ['newuser', 'new@test.com', 'hashedpassword']
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateSaldo', () => {
    it('should update saldo and return new balance', async () => {
      const mockResult = { id: 1, saldo: 1500 };
      db.query.mockResolvedValue({ rows: [mockResult] });

      const result = await User.updateSaldo(1, 500);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE usuarios SET saldo'),
        [500, 1]
      );
      expect(result.saldo).toBe(1500);
    });
  });
});

describe('Auth - JWT', () => {
  it('should generate valid token', () => {
    const user = { id: 1, username: 'test', email: 'test@test.com' };
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe(1);
    expect(decoded.username).toBe('test');
    expect(decoded.email).toBe('test@test.com');
  });

  it('should reject invalid token', () => {
    expect(() => {
      jwt.verify('invalid-token', process.env.JWT_SECRET);
    }).toThrow();
  });
});

describe('Password Hashing', () => {
  it('should hash password correctly', async () => {
    const password = 'mypassword123';
    const hash = await hashPassword(password);

    expect(hash).toBeTruthy();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);
  });

  it('should verify correct password', async () => {
    const password = 'mypassword123';
    const hash = await hashPassword(password);

    const isValid = await comparePassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject wrong password', async () => {
    const password = 'mypassword123';
    const hash = await hashPassword(password);

    const isValid = await comparePassword('wrongpassword', hash);
    expect(isValid).toBe(false);
  });
});
