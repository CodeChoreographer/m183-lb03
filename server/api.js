require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { initializeDatabase, queryDB, insertDB } = require("./database");

let db;

// Middleware zur Authentifizierung mit JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Kein Token vorhanden" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Ungültiges Token" });

    req.user = user;
    next();
  });
};

// API initialisieren
const initializeAPI = async (app) => {
  db = await initializeDatabase();

  app.get("/api/feed", authenticateToken, getFeed);
  app.post("/api/feed", authenticateToken, postTweet);
  app.post("/api/login", login);
};

// Feed abrufen (nur für authentifizierte Benutzer)
const getFeed = async (req, res) => {
  try {
    const query = "SELECT id, username, timestamp, text FROM tweets ORDER BY id DESC";
    const tweets = await queryDB(db, query);
    res.json(tweets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Serverfehler beim Abrufen des Feeds" });
  }
};

// Tweet posten (nur für eingeloggte Benutzer)
const postTweet = async (req, res) => {
  try {
    if (!req.user || !req.user.username) {
      return res.status(403).json({ error: "Nicht authentifiziert" });
    }

    const { text } = req.body;
    if (!text || text.length > 280) {
      return res.status(400).json({ error: "Tweet darf nicht leer oder länger als 280 Zeichen sein" });
    }

    const username = req.user.username;
    const timestamp = new Date().toISOString();

    const query = "INSERT INTO tweets (username, timestamp, text) VALUES (?, ?, ?)";
    await insertDB(db, query, [username, timestamp, text]);

    res.json({ status: "ok", message: "Tweet erfolgreich gepostet" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Serverfehler beim Posten des Tweets" });
  }
};

// Login-Funktion mit bcrypt & JWT-Erstellung
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Benutzername und Passwort erforderlich" });
    }

    const query = "SELECT * FROM users WHERE username = ?";
    const user = await queryDB(db, query, [username]);

    if (!user.length) {
      return res.status(401).json({ error: "Benutzer nicht gefunden" });
    }

    // Passwort-Hash prüfen mit bcrypt
    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return res.status(401).json({ error: "Falsches Passwort" });
    }

    const token = jwt.sign({ username: user[0].username }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "Login erfolgreich", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Serverfehler beim Login" });
  }
};

module.exports = { initializeAPI };
