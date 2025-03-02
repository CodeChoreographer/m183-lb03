const express = require("express");
const http = require("http");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { initializeAPI } = require("./api");
const pinoHttp = require("pino-http"); 
const logger = require("./logger");

const app = express();
app.use(express.json());
app.use(pinoHttp({ logger }));


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


app.disable("x-powered-by");

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 50, 
  message: "Zu viele Anfragen von dieser IP, bitte versuchen Sie es später erneut.",
});
app.use(limiter);

app.use(express.static("client"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client/index.html");
});

initializeAPI(app);

const serverPort = process.env.PORT || 3000;
http.createServer(app).listen(serverPort, () => {
 logger.info(`Server laeuft auf Port ${serverPort}`);
});
