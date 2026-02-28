require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const sqlite3 = require("sqlite3").verbose();

/* ===============================
   CREATE APP
================================ */
const app = express();

/* ===============================
   DATABASE (Render Persistent Disk)
================================ */
const db = new sqlite3.Database("/data/database.sqlite", (err) => {
  if (err) console.error(err.message);
  else console.log("✅ Connected to SQLite database");
});

/* ===============================
   PASSPORT CONFIG
================================ */
require("./config/passport");

/* ===============================
   ROUTES IMPORT
================================ */
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const resumeRoutes = require("./routes/resume");
const profileRoutes = require("./routes/profile");
const predictionRoutes = require("./routes/prediction");
const internshipRoutes = require("./routes/internships");
const applicationRoutes = require("./routes/applications");

/* ===============================
   GLOBAL MIDDLEWARE
================================ */

/* ---- CORS ---- */
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite local
      "http://localhost:8080", // alt dev
      process.env.FRONTEND_URL // production
    ],
    credentials: true,
  })
);

/* ---- BODY PARSER ---- */
app.use(express.json());

/* ---- SESSION ---- */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "allocateai-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // change true after HTTPS domain
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

/* ---- PASSPORT ---- */
app.use(passport.initialize());
app.use(passport.session());

/* ===============================
   HEALTH CHECK
================================ */
app.get("/", (req, res) => {
  res.send("AllocateAI Backend Running ✅");
});

/* ===============================
   API ROUTES
================================ */
app.use("/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api", resumeRoutes);
app.use("/api", profileRoutes);
app.use("/api", predictionRoutes);
app.use("/api", internshipRoutes);
app.use("/api", applicationRoutes);

/* ===============================
   ERROR HANDLER
================================ */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

/* ===============================
   SERVER START
================================ */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});