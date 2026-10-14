const path = require("path");
const Database = require("better-sqlite3");

const db = new Database(path.join(__dirname, "skills.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK (length(name) <= 40),
    teaches TEXT NOT NULL CHECK (length(teaches) <= 80),
    wantsToLearn TEXT NOT NULL CHECK (length(wantsToLearn) <= 80),
    category TEXT NOT NULL
      CHECK (category IN ('Creative', 'Tech', 'Lifestyle')),
    online INTEGER NOT NULL DEFAULT 0
      CHECK (online IN (0, 1))
  )
`);

module.exports = db;