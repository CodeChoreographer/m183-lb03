const express = require("express");
const http = require("http");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const pinoHttp = require("pino-http");
const logger = require("./logger");
const { initializeAPI } = require("./api");

const app = express();
app.use(express.json());

// 🚀 1. Pino-HTTP Middleware mit reduzierter Log-Ausgabe
app.use(
  pinoHttp({
    logger,
    customLogLevel: (res, err) => {
      if (res.statusCode >= 500 || err) return "error"; // Fehler-Logs nur bei Server-Fehlern
      if (res.statusCode >= 400) return "warn"; // Warnungen für fehlerhafte Anfragen (4xx)
      return "info";
    },
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          body: req.body, // Falls nötig (nur für Debugging, kann entfernt werden)
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);

// 🚀 2. Sicherheits-Header mit Helmet setzen
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.tailwindcss.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        frameSrc: [],
      },
    },
  })
);

// 🚀 3. Entfernen des "X-Powered-By" Headers
app.disable("x-powered-by");

// 🚀 4. Rate Limiting gegen Brute Force-Angriffe
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100,
  message: "Zu viele Anfragen von dieser IP, bitte versuchen Sie es später erneut.",
});
app.use(limiter);

// 🚀 5. Statische Dateien bereitstellen
app.use(express.static("client"));

// Startseite
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client/index.html");
});

// API initialisieren
initializeAPI(app);

// Server starten
const serverPort = process.env.PORT || 3000;
http.createServer(app).listen(serverPort, () => {
  logger.info(`🚀 Server läuft auf Port ${serverPort}`);
});
