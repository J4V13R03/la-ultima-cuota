require('dotenv').config();
const { execSync } = require('child_process');

try {
  execSync('npx node-pg-migrate up', { stdio: 'inherit' });
  console.log('Migrations applied successfully');
} catch (err) {
  console.error('Migration failed:', err.message);
}
