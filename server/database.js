const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const { promisify } = require("util");

const tweetsTableExists = "SELECT name FROM sqlite_master WHERE type='table' AND name='tweets'";
const createTweetsTable = `CREATE TABLE IF NOT EXISTS tweets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  timestamp TEXT,
  text TEXT
)`;
const usersTableExists = "SELECT name FROM sqlite_master WHERE type='table' AND name='users'";
const createUsersTable = `CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
)`;

const initializeDatabase = async () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database("./minitwitter.db", (err) => {
      if (err) reject(err);
    });

    db.serialize(async () => {
      db.run(createTweetsTable);
      db.run(createUsersTable);

      db.get(usersTableExists, [], async (err, row) => {
        if (err) console.error(err.message);
        if (!row) {
          console.log("Erstelle Nutzer mit sicheren Passwörtern...");

          const users = [
            { username: "switzerchees", password: "123456" },
            { username: "john", password: "123456" },
            { username: "jane", password: "123456" }
          ];

          for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            db.run("INSERT INTO users (username, password) VALUES (?, ?)", [
              user.username,
              hashedPassword
            ]);
          }
        }
      });
    });

    db.getAsync = promisify(db.get).bind(db);
    db.allAsync = promisify(db.all).bind(db);
    db.runAsync = promisify(db.run).bind(db);

    resolve(db);
  });
};

// SQL-Query ausführen (SELECT)
const queryDB = async (db, query, params = []) => {
  return await db.allAsync(query, params);
};

// SQL-Insert ausführen (INSERT, UPDATE, DELETE)
const insertDB = async (db, query, params = []) => {
  return await db.runAsync(query, params);
};

module.exports = { initializeDatabase, queryDB, insertDB };
