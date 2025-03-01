const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();

const tweetsTableExists =
  "SELECT name FROM sqlite_master WHERE type='table' AND name='tweets'";
const createTweetsTable = `CREATE TABLE tweets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  timestamp TEXT,
  text TEXT
)`;
const usersTableExists =
  "SELECT name FROM sqlite_master WHERE type='table' AND name='users'";
const createUsersTable = `CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
)`;

const initializeDatabase = async () => {
  const db = new sqlite3.Database("./minitwitter.db");

  db.serialize(() => {
    db.get(tweetsTableExists, [], async (err, row) => {
      if (err) return console.error(err.message);
      if (!row) {
        await db.run(createTweetsTable);
      }
    });

    db.get(usersTableExists, [], async (err, row) => {
      if (err) return console.error(err.message);
      if (!row) {
        db.run(createUsersTable, [], async (err) => {
          if (err) return console.error(err.message);

          // User erstellen mit gehashtem Passwort
          const users = [
            { username: "switzerchees", password: "123456" },
            { username: "john", password: "123456" },
            { username: "jane", password: "123456" },
          ];

          for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            db.run("INSERT INTO users (username, password) VALUES (?, ?)", [
              user.username,
              hashedPassword,
            ]);
          }
        });
      }
    });
  });

  return db;
};

module.exports = { initializeDatabase };
