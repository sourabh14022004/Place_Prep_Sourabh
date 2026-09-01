/**
 * backend/scripts/set-password.js
 * Set a user's password directly — the "I'm locked out" recovery tool.
 *
 * Usage:
 *   node scripts/set-password.js <email> <newPassword>
 *   node scripts/set-password.js --list          (list all accounts)
 *
 * Examples:
 *   node scripts/set-password.js arjun.mehta@newtonschool.co Student@123
 */

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Load backend/.env
try {
  const envSrc = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  for (const line of envSrc.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {}

async function main() {
  const [arg1, arg2] = process.argv.slice(2);

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI missing — check backend/.env');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  if (arg1 === '--list') {
    const users = await db.collection('users').find({}).project({ email: 1, role: 1, isActive: 1 }).toArray();
    console.log('\nAll accounts:');
    users.forEach((u) => console.log(`  ${String(u.email).padEnd(40)} ${String(u.role).padEnd(8)} active=${u.isActive}`));
    await mongoose.disconnect();
    return;
  }

  if (!arg1 || !arg2) {
    console.error('Usage: node scripts/set-password.js <email> <newPassword>');
    console.error('       node scripts/set-password.js --list');
    await mongoose.disconnect();
    process.exit(1);
  }

  if (arg2.length < 6) {
    console.error('Password must be at least 6 characters.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const bcrypt = require(path.join(__dirname, '..', 'node_modules', 'bcryptjs'));
  const hash = await bcrypt.hash(arg2, 10);

  const res = await db.collection('users').updateOne(
    { email: arg1.toLowerCase().trim() },
    { $set: { passwordHash: hash } }
  );

  if (res.matchedCount === 0) {
    console.error(`No user found with email: ${arg1}`);
    console.error('Run `--list` to see all accounts.');
  } else {
    console.log(`✓ Password updated for ${arg1}`);
    console.log(`  New password: ${arg2}`);
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
