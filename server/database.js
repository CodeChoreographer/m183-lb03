const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

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

  db.serialize(async () => {
    db.get(usersTableExists, [], async (err, row) => {
      if (err) return console.error(err.message);
      if (!row) {
        db.run(createUsersTable, [], async (err) => {
          if (err) return console.error(err.message);

          // Passwörter hashen, bevor sie in die DB geschrieben werden
          const hashedPass1 = await bcrypt.hash("123456", 10);
          const hashedPass2 = await bcrypt.hash("123456", 10);
          const hashedPass3 = await bcrypt.hash("123456", 10);

          db.run(
            `INSERT INTO users (username, password) VALUES 
            ('switzerchees', ?), 
            ('john', ?), 
            ('jane', ?)`, 
            [hashedPass1, hashedPass2, hashedPass3]
          );
        });
      }
    });

    db.get(tweetsTableExists, [], async (err, row) => {
      if (err) return console.error(err.message);
      if (!row) {
        db.run(createTweetsTable);
      }
    });
  });

  return db;
};

const insertDB = (db, query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
};

const queryDB = (db, query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

module.exports = { initializeDatabase, queryDB, insertDB };
