const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const dataDirectory = path.join(__dirname, 'data');
fs.mkdirSync(dataDirectory, { recursive: true });

const db = new Database(path.join(dataDirectory, 'profiles.db'));

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL CHECK (age >= 40),
      city TEXT NOT NULL,
      interests TEXT NOT NULL,
      photo TEXT,
      visibility TEXT NOT NULL DEFAULT 'public'
        CHECK (visibility IN ('public', 'restricted'))
    );
  `);

  const result = db.prepare(
    'SELECT COUNT(*) AS count FROM profiles'
  ).get();

  console.log('Profile database is ready.');
  console.log('Profiles stored:', result.count);
} finally {
  db.close();
}