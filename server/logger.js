const pino = require("pino");
const fs = require("fs");
const path = require("path");

const logDirectory = path.join(__dirname, "logs");
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const logFilePath = path.join(logDirectory, "app.log");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  timestamp: () => `,"time":"${new Date().toISOString()}"`, 
  transport: {
    targets: [
      {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "yyyy-mm-dd HH:MM:ss",
          ignore: "pid", 
          messageFormat: "[{time}] {level}: {msg}", 
        },
      },
      {
        target: "pino-pretty",
        options: {
          destination: logFilePath, 
          mkdir: true,
          colorize: false,
          translateTime: "yyyy-mm-dd HH:MM:ss",
          ignore: "pid", 
          messageFormat: "[{time}] {level}: {msg}", 
        },
      },
    ],
  },
});

module.exports = logger;