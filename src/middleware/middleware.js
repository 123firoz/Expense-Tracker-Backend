const fs = require("fs");

function getFormattedLog(req) {
  const now = new Date();

  // Format date as YYYY-MM-DD
  const date = now.toISOString().split('T')[0];

  // Format time as HH:mm:ss
  const time = now.toTimeString().split(' ')[0];

  // Create the log entry
  const logEntry = `
Date      : ${date}, 
Time      : ${time}, 
IP Address: ${req.ip}, 
Method    : ${req.method}, 
Path      : ${req.path}
`;

  return logEntry;
}

function track(filename) {
  return (req, res, next) => {
    const logEntry = getFormattedLog(req);

    fs.appendFile(filename, logEntry, (err) => {
      if (err) {
        console.error("Error writing to log file:", err);
      }
      next();
    });
  };
}

module.exports = { track };
