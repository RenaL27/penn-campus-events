const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:3000" }));
app.use(express.json({ limit: "100kb" }));
app.use("/auth", require("./routes/auth"));
app.use("/events", require("./routes/events"));
app.use("/users", require("./routes/users"));
app.use("/reels", require("./routes/reels"));
app.use((req, res) => res.status(404).json({ error: "Not found." }));
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.code === "LIMIT_FILE_SIZE")
    return res.status(413).json({ error: "Videos must be 50 MB or smaller." });
  if (err.name === "MulterError")
    return res
      .status(400)
      .json({ error: "Upload one video with an event and caption." });
  if (err.name === "ValidationError" || err.name === "CastError")
    return res.status(400).json({
      error:
        err.name === "CastError"
          ? "Invalid identifier or field."
          : Object.values(err.errors)
              .map((e) => e.message)
              .join(" "),
    });
  if (err.name === "VersionError")
    return res
      .status(409)
      .json({ error: "This event changed. Refresh and try again." });
  if (err.code === 11000)
    return res.status(409).json({ error: "This record already exists." });
  if (err.status && err.status < 500)
    return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});
module.exports = app;
