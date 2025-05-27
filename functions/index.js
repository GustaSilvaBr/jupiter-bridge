require("dotenv").config();

const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const express = require("express");
const ftp = require("basic-ftp");
const { PassThrough } = require("stream");

const app = express();

app.get("/juptr", async (req, res) => {
  const fileName = req.query.file;
  if (!fileName) {
    logger.error("Missing 'file' query parameter");
    return res.status(400).send("Missing 'file' query parameter");
  }

  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = false;

  try {
    await ftpClient.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      secure: false, // or true if FTPS
    });
    const remoteFileName = `/juptr/${fileName}.csv`;

    const stream = new PassThrough();
    let csvData = "";

    stream.on("data", (chunk) => {
      csvData += chunk.toString();
    });

    await ftpClient.downloadTo(stream, remoteFileName);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${remoteFileName}"`);
    res.send(csvData);
  } catch (error) {
    logger.error("FTP error:", error);
    res.status(500).send("Error fetching the CSV file");
  } finally {
    ftpClient.close();
  }
});

// Export Firebase function
exports.jupiterBridgeApi = functions.https.onRequest(app);
