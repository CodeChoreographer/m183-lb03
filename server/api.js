require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const CryptoJS = require("crypto-js");
const { initializeDatabase, queryDB, insertDB } = require("./database");
const logger = require("./logger");
const cookieParser = require("cookie-parser");

let db;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "supersecretkey";

const encryptText = (text) => CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
const decryptText = (ciphertext) => CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);

const authenticateToken = (req, res, next) => {
  const token = req.cookies.authToken;
  if (!token) return res.status(401).json({ error: "Kein Token vorhanden" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Ungültiges Token" });

    req.user = user;
    next();
  });
};

const initializeAPI = async (app) => {
  db = await initializeDatabase();
  app.use(cookieParser());

  app.get("/api/feed", authenticateToken, getFeed);
  app.post("/api/feed", authenticateToken, postTweet);
  app.post("/api/login", login);
  app.post("/api/logout", logout);
};

const getFeed = async (req, res) => {
  try {
    if (!req.user || !req.user.username) return res.status(403).json({ error: "Nicht authentifiziert" });

    const query = "SELECT id, username, timestamp, text FROM tweets ORDER BY id DESC";
    const encryptedTweets = await queryDB(db, query, []);

    const tweets = encryptedTweets.map((tweet) => ({
      id: tweet.id,
      username: tweet.username,
      timestamp: tweet.timestamp,
      text: decryptText(tweet.text),
    }));

    res.json(tweets);
  } catch (error) {
    logger.error(`❌ Fehler beim Abrufen des Feeds: ${error.message}`);
    res.status(500).json({ error: "Serverfehler beim Abrufen des Feeds" });
  }
};

const postTweet = async (req, res) => {
  try {
    if (!req.user || !req.user.username) {
      logger.warn("Unautorisierter Post-Versuch erkannt!");
      return res.status(403).json({ error: "Nicht authentifiziert" });
    }

    let { text } = req.body;

    text = text.replace(/[<>]/g, "");

    if (!text.trim() || text.length > 280) {
      logger.warn(`🚨 Ungültiger Tweet von ${req.user.username}`);
      return res.status(400).json({ error: "Tweet darf nicht leer oder länger als 280 Zeichen sein" });
    }

    const username = req.user.username;
    const timestamp = new Date().toISOString();
    const encryptedText = encryptText(text);

    const query = "INSERT INTO tweets (username, timestamp, text) VALUES (?, ?, ?)";
    await insertDB(db, query, [username, timestamp, encryptedText]);

    logger.info(`✅ Neuer verschlüsselter Tweet von ${username}`);
    res.json({ status: "ok", message: "Tweet erfolgreich gepostet" });
  } catch (error) {
    logger.error(`❌ Fehler beim Posten eines Tweets: ${error.message}`);
    res.status(500).json({ error: "Serverfehler beim Posten des Tweets" });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      logger.warn(`🚨 Fehlgeschlagener Login-Versuch ohne Username oder Passwort`);
      return res.status(400).json({ error: "Benutzername und Passwort erforderlich" });
    }

    const query = "SELECT * FROM users WHERE username = ?";
    const user = await queryDB(db, query, [username]);

    if (!user.length) {
      logger.warn(`🔴 Fehlgeschlagener Login für Benutzer: ${username}`);
      return res.status(401).json({ error: "Benutzer nicht gefunden" });
    }

    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      logger.warn(`🔴 Falsches Passwort für Benutzer: ${username}`);
      return res.status(401).json({ error: "Falsches Passwort" });
    }

    const token = jwt.sign({ username: user[0].username }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      maxAge: 60 * 60 * 1000, 
    });

    logger.info(`✅ Erfolgreicher Login für Benutzer: ${username}`);
    res.json({ message: "Login erfolgreich" });
  } catch (error) {
    logger.error(`❌ Fehler beim Login: ${error.message}`);
    res.status(500).json({ error: "Serverfehler beim Login" });
  }
};

const logout = async (req, res) => {
  res.clearCookie("authToken");
  res.json({ message: "Logout erfolgreich" });
};

module.exports = { initializeAPI };
