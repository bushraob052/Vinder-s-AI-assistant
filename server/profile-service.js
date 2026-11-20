const path = require('node:path');
const Database = require('better-sqlite3');

function searchProfiles(city = '', interest = '') {
  if (
    typeof city !== 'string' ||
    typeof interest !== 'string' ||
    city.length > 60 ||
    interest.length > 60
  ) {
    throw new Error('City and interest must be text of up to 60 characters.');
  }

  const db = new Database(
    path.join(__dirname, 'data', 'profiles.db'),
    { readonly: true, fileMustExist: true }
  );

  try {
    const rows = db.prepare(`
      SELECT id, name, age, city, interests, photo
      FROM profiles
      WHERE visibility = 'public'
        AND (@city = '' OR city = @city COLLATE NOCASE)
      ORDER BY id
    `).all({ city: city.trim() });

    const interestFilter = interest.trim().toLowerCase();

    return rows
      .map(profile => ({
        ...profile,
        interests: JSON.parse(profile.interests)
      }))
      .filter(profile =>
        !interestFilter ||
        profile.interests.some(
          item => item.toLowerCase() === interestFilter
        )
      )
      .slice(0, 10);
  } finally {
    db.close();
  }
}

module.exports = { searchProfiles };