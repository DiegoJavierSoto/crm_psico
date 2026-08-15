/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const match = trimmed.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let value = match[2] || '';
        value = value.replace(/^['"]|['"]$/g, '');
        if (!process.env[match[1]]) process.env[match[1]] = value;
      }
    });
  }
}

loadEnv();

const url = (process.env.TURSO_DATABASE_URL || '').trim();
const authToken = (process.env.TURSO_AUTH_TOKEN || '').trim();

if (!url || (!url.startsWith('libsql://') && !url.startsWith('https://'))) {
  console.error('❌ Error: TURSO_DATABASE_URL in .env must start with libsql:// or https://');
  process.exit(1);
}

const client = createClient({ url, authToken });

async function getCounts() {
  const tables = ['User', 'Patient', 'Appointment', 'SessionNote', 'FollowUp', 'Alert'];
  const counts = {};
  for (const table of tables) {
    try {
      const res = await client.execute(`SELECT COUNT(*) as count FROM "${table}"`);
      counts[table] = res.rows[0].count;
    } catch {
      counts[table] = 'Table not found';
    }
  }
  return counts;
}

async function exportDump() {
  const backupDir = path.resolve(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `turso_backup_${timestamp}.sql`);

  console.log(`📦 Generating backup dump file to: ${backupFile}`);

  const tablesRes = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
  const tables = tablesRes.rows.map(r => r.name);

  let dumpSql = `-- Turso Database Dump ${new Date().toISOString()}\n`;
  dumpSql += `PRAGMA foreign_keys=OFF;\n\n`;

  for (const table of tables) {
    const schemaRes = await client.execute(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${table}';`);
    if (schemaRes.rows.length > 0 && schemaRes.rows[0].sql) {
      dumpSql += `${schemaRes.rows[0].sql};\n\n`;
    }

    const dataRes = await client.execute(`SELECT * FROM "${table}"`);
    for (const row of dataRes.rows) {
      const keys = Object.keys(row);
      const cols = keys.map(k => `"${k}"`).join(', ');
      const vals = keys.map(k => {
        const val = row[k];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'number') return val;
        return `'${String(val).replace(/'/g, "''")}'`;
      }).join(', ');
      dumpSql += `INSERT INTO "${table}" (${cols}) VALUES (${vals});\n`;
    }
    dumpSql += `\n`;
  }

  dumpSql += `PRAGMA foreign_keys=ON;\n`;
  fs.writeFileSync(backupFile, dumpSql, 'utf8');
  console.log(`✅ Backup successfully created at: ${backupFile}`);
  return backupFile;
}

async function runBackupMode() {
  console.log('🔍 Checking Turso Database Connection & Pre-Migration Status...');
  const counts = await getCounts();
  console.log('📊 Current Record Counts in Turso:');
  console.table(counts);

  const backupFile = await exportDump();

  const freqRes = await client.execute('SELECT sessionFrequency, COUNT(*) as count FROM "Patient" GROUP BY sessionFrequency;');
  console.log('\n📊 Current sessionFrequency Distribution in Turso:');
  console.table(freqRes.rows);

  console.log(`\n✅ Backup ready at: ${backupFile}`);
}

async function runMigrateMode() {
  console.log('⚡ Starting High-Security Non-Destructive In-Place Migration on Turso Database...');

  // 1. Pre-Migration Inspections and Snapshots
  const preCounts = await getCounts();
  console.log('📊 Pre-migration counts:', preCounts);

  const prePatientsRes = await client.execute('SELECT id, firstName, lastName, sessionFrequency FROM "Patient";');
  const prePatients = prePatientsRes.rows;
  const prePatientIds = prePatients.map(p => p.id).sort();

  const preAppointmentsRes = await client.execute('SELECT id, patientId FROM "Appointment";');
  const preAppointments = preAppointmentsRes.rows;

  const preSessionNotesRes = await client.execute('SELECT id, patientId FROM "SessionNote";');
  const preSessionNotes = preSessionNotesRes.rows;

  console.log(`🔎 Pre-Migration Snapshot: ${prePatients.length} Patients, ${preAppointments.length} Appointments, ${preSessionNotes.length} Session Notes.`);

  // 2. Strict Whitelist Check for sessionFrequency values (NO SILENT FALLBACKS)
  const allowedInputValues = [0, 1, 2, 3, '0', '1', '2', '3', 'Semanal', 'Dos veces por semana', 'Quincenal', 'Mensual', 'A demanda'];
  for (const p of prePatients) {
    const val = p.sessionFrequency;
    if (val === null || val === undefined || !allowedInputValues.includes(val)) {
      console.error(`🚨 MIGRATION ABORTED: Patient ${p.id} (${p.firstName} ${p.lastName}) has unmapped or NULL sessionFrequency value: ${JSON.stringify(val)}`);
      process.exit(1);
    }
  }
  console.log('✅ Whitelist Validation Passed: All existing sessionFrequency values are recognized and mapped.');

  // 3. Mandatory Pre-Migration Backup Dump
  console.log('📦 Creating mandatory safety backup dump before applying changes...');
  const backupFile = await exportDump();

  // 4. In-Place Atomic Transaction SQL Execution
  console.log('🛠️ Starting In-Place Atomic Transaction on Turso...');
  const migrationStatements = [
    `ALTER TABLE "Patient" ADD COLUMN "sessionFrequency_temp" TEXT DEFAULT 'Semanal';`,
    `UPDATE "Patient" SET "sessionFrequency_temp" = CASE "sessionFrequency" 
       WHEN 1 THEN 'Semanal' 
       WHEN '1' THEN 'Semanal'
       WHEN 2 THEN 'Dos veces por semana' 
       WHEN '2' THEN 'Dos veces por semana'
       WHEN 3 THEN 'Quincenal' 
       WHEN '3' THEN 'Quincenal'
       WHEN 0 THEN 'A demanda' 
       WHEN '0' THEN 'A demanda'
       WHEN 'Semanal' THEN 'Semanal'
       WHEN 'Dos veces por semana' THEN 'Dos veces por semana'
       WHEN 'Quincenal' THEN 'Quincenal'
       WHEN 'Mensual' THEN 'Mensual'
       WHEN 'A demanda' THEN 'A demanda'
       ELSE NULL 
     END;`,
    `ALTER TABLE "Patient" DROP COLUMN "sessionFrequency";`,
    `ALTER TABLE "Patient" RENAME COLUMN "sessionFrequency_temp" TO "sessionFrequency";`,
    `CREATE TABLE IF NOT EXISTS "PasswordReset" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "expiresAt" DATETIME NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "PasswordReset_token_key" ON "PasswordReset"("token");`,
    `CREATE INDEX IF NOT EXISTS "PasswordReset_userId_idx" ON "PasswordReset"("userId");`
  ];

  const tx = await client.transaction('write');
  try {
    for (const stmt of migrationStatements) {
      await tx.execute(stmt);
    }
    await tx.commit();
    console.log('✅ Atomic Transaction Committed Successfully!');
  } catch (err) {
    console.error('🚨 MIGRATION TRANSACTION FAILED! Executing Atomic ROLLBACK...', err.message);
    await tx.rollback();
    throw err;
  }

  // 5. Post-Migration Strict Verification Suite
  console.log('🔍 Executing Post-Migration Verification Suite...');

  // A) Count assertion
  const postCounts = await getCounts();
  console.log('📊 Post-migration counts:', postCounts);
  assert.strictEqual(postCounts.Patient, preCounts.Patient, `Patient count mismatch! Expected ${preCounts.Patient}, got ${postCounts.Patient}`);

  // B) Patient IDs assertion
  const postPatientsRes = await client.execute('SELECT id, firstName, lastName, sessionFrequency FROM "Patient";');
  const postPatients = postPatientsRes.rows;
  const postPatientIds = postPatients.map(p => p.id).sort();
  assert.deepStrictEqual(postPatientIds, prePatientIds, 'Patient ID set mismatch! Some IDs were lost or altered.');

  // C) Expected string conversion assertion per patient (STRICT, NO DEFAULT FALLBACKS)
  const expectedMap = {
    0: 'A demanda', '0': 'A demanda',
    1: 'Semanal', '1': 'Semanal',
    2: 'Dos veces por semana', '2': 'Dos veces por semana',
    3: 'Quincenal', '3': 'Quincenal',
    'Semanal': 'Semanal', 'Dos veces por semana': 'Dos veces por semana',
    'Quincenal': 'Quincenal', 'Mensual': 'Mensual', 'A demanda': 'A demanda'
  };

  const postPatientMap = {};
  postPatients.forEach(p => { postPatientMap[p.id] = p; });

  for (const preP of prePatients) {
    const postP = postPatientMap[preP.id];
    const expectedFreq = expectedMap[preP.sessionFrequency];
    assert.ok(expectedFreq, `Unmapped sessionFrequency value '${preP.sessionFrequency}' encountered for Patient ${preP.id}`);
    assert.strictEqual(
      postP.sessionFrequency,
      expectedFreq,
      `Conversion error for Patient ${preP.id} (${preP.firstName} ${preP.lastName}): expected '${expectedFreq}', got '${postP.sessionFrequency}'`
    );
  }
  console.log('✅ Value Conversion Assertion Passed: Every patient sessionFrequency string converted exactly as expected without fallbacks.');

  // D) Relational Integrity assertions for Appointments and Session Notes
  const postAppointmentsRes = await client.execute('SELECT id, patientId FROM "Appointment";');
  assert.strictEqual(postAppointmentsRes.rows.length, preAppointments.length, `Appointment count mismatch! Expected ${preAppointments.length}, got ${postAppointmentsRes.rows.length}`);
  for (const appt of postAppointmentsRes.rows) {
    assert.ok(postPatientMap[appt.patientId], `Orphaned Appointment found! ID ${appt.id} references missing patientId ${appt.patientId}`);
  }

  const postSessionNotesRes = await client.execute('SELECT id, patientId FROM "SessionNote";');
  assert.strictEqual(postSessionNotesRes.rows.length, preSessionNotes.length, `SessionNote count mismatch! Expected ${preSessionNotes.length}, got ${postSessionNotesRes.rows.length}`);
  for (const note of postSessionNotesRes.rows) {
    assert.ok(postPatientMap[note.patientId], `Orphaned SessionNote found! ID ${note.id} references missing patientId ${note.patientId}`);
  }

  console.log('✅ Relational Integrity Assertion Passed: All Appointments and SessionNotes retain valid foreign keys.');
  console.log('\n🎉 MIGRATION SUCCESSFUL! All records, IDs, and relations verified intact.');
  console.log(`📦 Pre-migration backup saved at: ${backupFile}`);
}

async function runRestoreMode(fileArg) {
  if (!fileArg) {
    console.error('❌ Error: Please specify the path to the backup SQL file to restore.');
    console.error('Usage: node prisma/turso-backup-and-migrate.js restore <path-to-sql-file>');
    process.exit(1);
  }

  const sqlPath = path.resolve(process.cwd(), fileArg);
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Backup file not found at: ${sqlPath}`);
    process.exit(1);
  }

  console.log(`⚠️ RESTORING TURSO DATABASE FROM BACKUP: ${sqlPath}`);
  const dumpSql = fs.readFileSync(sqlPath, 'utf8');

  await client.execute('PRAGMA foreign_keys=OFF;');
  const tablesRes = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
  for (const row of tablesRes.rows) {
    await client.execute(`DROP TABLE IF EXISTS "${row.name}";`);
  }

  await client.executeMultiple(dumpSql);
  await client.execute('PRAGMA foreign_keys=ON;');

  console.log('✅ RESTORATION COMPLETED SUCCESSFULLY!');
}

async function main() {
  const mode = process.argv[2];
  const arg = process.argv[3];
  try {
    if (mode === 'backup') {
      await runBackupMode();
    } else if (mode === 'migrate') {
      await runMigrateMode();
    } else if (mode === 'restore') {
      await runRestoreMode(arg);
    } else {
      console.log('Usage: node prisma/turso-backup-and-migrate.js [backup|migrate|restore <file.sql>]');
    }
  } catch (err) {
    console.error('\n❌ ERROR OCCURRED DURING SCRIPT EXECUTION:', err.message);
    process.exit(1);
  } finally {
    client.close();
  }
}

main();
