const router = require("express").Router();
const db = require("../config/db");

/* =====================================
   GET USER PROFILE
===================================== */
router.get("/profile", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not logged in" });
  }

  db.get(
    "SELECT * FROM user_profiles WHERE user_id = ?",
    [req.user.id],
    (err, row) => {
      if (err) {
        console.log("DB ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      if (!row) {
        return res.json({});
      }

      res.json({
        ...row,
        skills: row.skills ? row.skills.split(",") : []
      });
    }
  );
});

/* =====================================
   SAVE / UPDATE PROFILE
===================================== */
router.post("/profile", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not logged in" });
  }

  const { college, degree, skills, experience } = req.body;

  /* ---- SAFE SKILLS HANDLING ---- */
  const skillsString = Array.isArray(skills)
    ? skills.join(",")
    : skills || "";

  /* ---- UPSERT (NO DUPLICATES) ---- */
  db.run(
    `INSERT INTO user_profiles
   (user_id, college, degree, skills, experience)
   VALUES (?, ?, ?, ?, ?)
   ON CONFLICT(user_id)
   DO UPDATE SET
     college=excluded.college,
     degree=excluded.degree,
     skills=excluded.skills,
     experience=excluded.experience`,
    [
      req.user.id,
      college,
      degree,
      Array.isArray(skills) ? skills.join(",") : skills,
      experience
    ],
    function (err) {
      if (err) {
        console.log("SAVE ERROR:", err);
        return res.status(500).json(err);
      }

      res.json({ message: "Profile saved ✅" });
    }
  );

});

module.exports = router;