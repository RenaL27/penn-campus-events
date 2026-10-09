const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const mongoose = require("mongoose");
const path = require("node:path");
const fs = require("node:fs");
const app = express();
app.disable("x-powered-by");
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" }, contentSecurityPolicy: { directives: { connectSrc: ["'self'", process.env.CLIENT_ORIGIN || "http://localhost:3000"], mediaSrc: ["'self'", "blob:"], imgSrc: ["'self'", "data:", "https:"] } } }));
app.get("/health", (req, res) => res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({ status: mongoose.connection.readyState === 1 ? "ok" : "unavailable" }));
app.use(rateLimit({ windowMs: 60000, limit: 300, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Too many requests. Please try again shortly." } }));
app.use("/auth", rateLimit({ windowMs: 15 * 60000, limit: 20, skipSuccessfulRequests: true, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Too many login attempts. Try again in 15 minutes." } }));
let activeUploads = 0;
app.use("/reels", (req, res, next) => {
  if (req.method !== "POST" || req.path !== "/") return next();
  if (activeUploads >= 2) return res.status(503).json({ error: "Uploads are busy. Please try again shortly." });
  activeUploads++;
  let released = false;
  const release = () => { if (!released) { released = true; activeUploads--; } };
  res.once("finish", release); res.once("close", release);
  next();
});
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:3000" }));
app.use(express.json({ limit: "100kb" }));
const spaBuild = path.resolve(__dirname, "../../frontend/build");
if (process.env.NODE_ENV === "production" && fs.existsSync(path.join(spaBuild, "index.html"))) {
  app.use((req, res, next) => {
    if (req.method === "GET" && req.headers.accept?.includes("text/html") && !req.path.startsWith("/auth/") && !req.path.startsWith("/users/") && !req.path.endsWith("/video") && req.path !== "/health") return res.sendFile(path.join(spaBuild, "index.html"));
    next();
  });
}
app.use("/auth", require("./routes/auth"));
app.use("/events", require("./routes/events"));
app.use("/users", require("./routes/users"));
app.use("/notifications", require("./routes/notifications"));
app.use("/reels", require("./routes/reels"));
const frontendBuild = path.resolve(__dirname, "../../frontend/build");
if (fs.existsSync(path.join(frontendBuild, "index.html")) && process.env.NODE_ENV === "production") {
  app.use(express.static(frontendBuild));
  app.get(/^(?!\/(?:auth|users|events|reels|notifications|health)(?:\/|$)).*/, (req, res) => res.sendFile(path.join(frontendBuild, "index.html")));
  // Browser event pages share names with API routes; HTML navigation gets the SPA.
}
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
