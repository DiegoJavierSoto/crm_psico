/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@libsql/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Self-contained .env parser to avoid requiring external dependencies
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const match = trimmed.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

const url = (process.env.TURSO_DATABASE_URL || '').trim();
const authToken = (process.env.TURSO_AUTH_TOKEN || '').trim();

if (!url) {
  console.error('❌ Error: TURSO_DATABASE_URL environment variable is not defined in .env file.');
  process.exit(1);
}

if (!url.startsWith('libsql://') && !url.startsWith('https://')) {
  console.error('❌ Error: TURSO_DATABASE_URL must start with "libsql://" or "https://" to push to Turso.');
  console.error(`Current value: ${url}`);
  process.exit(1);
}

console.log('⚡ Generating schema migration script from Prisma schema...');
let sql = '';
try {
  sql = execSync('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script', {
    encoding: 'utf8'
  });
} catch (err) {
  console.error('❌ Error generating schema diff:', err.message);
  process.exit(1);
}

if (!sql.trim()) {
  console.log('ℹ️ No database schema changes detected to push.');
  process.exit(0);
}

console.log('⚡ Connecting to Turso database...');
const client = createClient({ url, authToken });

async function main() {
  try {
    console.log('⚡ Applying schema to remote Turso database...');
    await client.executeMultiple(sql);
    console.log('🎉 Successfully pushed schema to Turso database!');
  } catch (err) {
    console.error('❌ Error applying schema changes:', err.message);
    process.exit(1);
  } finally {
    client.close();
  }
}

main();
