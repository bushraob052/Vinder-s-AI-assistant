const path = require('node:path');
const { randomInt } = require('node:crypto');
const Database = require('better-sqlite3');

const db = new Database(
  path.join(__dirname, 'data', 'profiles.db'),
  { fileMustExist: true }
);

const names = [
  'Ava', 'Bo', 'Nora', 'Sam', 'Lina',
  'Alex', 'Robin', 'Noor', 'Jules', 'Mila'
];

const cities = [
  'Breda', 'Eindhoven', 'Utrecht', 'Leiden', 'Groningen'
];

const interests = [
  'coffee', 'hiking', 'cooking', 'music', 'reading',
  'cycling', 'photography', 'gardening', 'travel', 'swimming'
];

function pick(items) {
  return items[randomInt(items.length)];
}

function generateInterests() {
  const selected = new Set();

  while (selected.size < 3) {
    selected.add(pick(interests));
  }

  return [...selected];
}

try {
  const { count } = db.prepare(
    'SELECT COUNT(*) AS count FROM profiles'
  ).get();

  if (count > 0) {
    console.log('Database already contains profiles. Nothing changed.');
  } else {
    const insert = db.prepare(`
      INSERT INTO profiles
        (name, age, city, interests, photo, visibility)
      VALUES
        (@name, @age, @city, @interests, @photo, @visibility)
    `);

    const seed = db.transaction(() => {
      for (let index = 0; index < 100; index++) {
        insert.run({
          name: pick(names),
          age: randomInt(40, 71),
          city: pick(cities),
          interests: JSON.stringify(generateInterests()),
          photo: null,
          visibility: index < 10 ? 'restricted' : 'public'
        });
      }
    });

    seed();
    console.log('Generated 100 fictional profiles.');
  }

  console.table(
    db.prepare(`
      SELECT visibility, COUNT(*) AS count
      FROM profiles
      GROUP BY visibility
    `).all()
  );
} finally {
  db.close();
}