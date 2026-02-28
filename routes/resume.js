const router = require("express").Router();
const multer = require("multer");
const pdf = require("pdf-parse");

/* ===============================
   UPLOAD CONFIG
================================ */

const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ===============================
   SIMPLE SKILL AI
================================ */

const knownSkills = [
  "python",
  "sql",
  "react",
  "javascript",
  "analytics",
  "machine learning",
  "product management",
  "agile",
  "excel",
  "node",
];

/* ===============================
   RESUME PARSER
================================ */

router.post("/resume-upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    let text = "";

    /* ===== PDF ===== */
    if (req.file.mimetype === "application/pdf") {
      const data = await pdf(req.file.buffer);
      text = data.text.toLowerCase();
    }

    /* ===== TXT ===== */
    else if (req.file.mimetype === "text/plain") {
      text = req.file.buffer.toString("utf8").toLowerCase();
    }

    else {
      return res.status(400).json({
        message: "Only PDF or TXT allowed",
      });
    }

    /* ===== SKILL EXTRACTION ===== */

    const detectedSkills = knownSkills.filter(skill =>
      text.includes(skill)
    );

    let education = "";
    if (text.includes("b.tech")) education = "B.Tech";
    if (text.includes("bachelor")) education = "Bachelor Degree";

    res.json({
      skills: detectedSkills.join(", "),
      education,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Resume parsing failed" });
  }
});

module.exports = router;