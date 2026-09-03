const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const hashPassword = async (plain) => {
  return bcrypt.hash(plain, SALT_ROUNDS);
};

const comparePassword = async (plain, hash) => {
  return bcrypt.compare(plain, hash);
};

module.exports = { hashPassword, comparePassword };
