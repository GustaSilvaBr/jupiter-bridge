require("dotenv").config()

const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const express  = require("express");
const ftp = require("basic-ftp");

const app = express();

app.get("/juptr", async (req, res) => {
  const fileName = req.query.file;
  if (!fileName) {
    logger.error("Missing 'file' query parameter")
    return res.status(400).send("Missing 'file' query parameter");
  }

  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = false;

  try {
    // Connect to FTP server (replace with your config)
    await ftpClient.access({
      host: process.env.HOST,
      user: process.env.USER,
      password: process.env.PASSSWORD,
      secure: false, // or true if FTPS
    });

    const remoteFileName = `${fileName}.csv`;

    // Download file into a string buffer
    let csvData = "";
    await ftpClient.downloadTo(
      // Writable stream to accumulate data
      {
        write(chunk) {
          csvData += chunk.toString();
        },
      },
      remoteFileName
    );

    // Return CSV content with appropriate headers
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${remoteFileName}"`
    );
    res.send(csvData);
  } catch (error) {
    logger.error("FTP error:", error)
    res.status(500).send("Error fetching the CSV file");
  } finally {
    ftpClient.close();
  }
});

//app.use(express.json());
exports.jupiterBridgeApi = functions.https.onRequest(app);
