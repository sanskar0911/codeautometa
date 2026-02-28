const router = require("express").Router();
const db = require("../config/db");

/* ===============================
   AI GREEDY PREDICTION
================================ */

router.get("/predictions", (req, res) => {

  if (!req.user) {
    return res.status(401).json({ message: "Not logged in" });
  }

  /* GET USER PROFILE */
  db.get(
    "SELECT * FROM user_profiles WHERE user_id = ?",
    [req.user.id],
    (err, profile) => {

      if (err) return res.status(500).json(err);
      if (!profile) return res.json([]);

      /* USER DATA */
      const userSkills = profile.skills
        ? profile.skills.toLowerCase().split(",").map(s => s.trim())
        : [];

      const userDegree = (profile.degree || "").toLowerCase();
      const userExp = Number(profile.experience || 0);

      /* INTERNSHIPS FROM DB */
      db.all("SELECT * FROM internships", [], (err, internships) => {
        if (err) return res.status(500).json(err);

        /* ===============================
           GREEDY MATCH SCORING
        ================================= */
        const results = internships.map(job => {
          const jobSkills = job.skills ? job.skills.toLowerCase().split(",").map(s => s.trim()) : [];

          // ---- Skill Matching ----
          let matchedSkills = 0;
          if (jobSkills.length > 0 && userSkills.length > 0) {
            matchedSkills = jobSkills.filter(skill =>
              userSkills.includes(skill)
            ).length;
          }

          let matchPercent = 0;
          if (jobSkills.length > 0) {
            matchPercent = Math.round((matchedSkills / jobSkills.length) * 100);
          }

          // ---- Education & Experience Extra Weights ----
          // Fallback to minimal matching logic if user has them
          if (userExp > 0) {
            matchPercent = Math.min(100, matchPercent + (userExp * 5));
          }
          if (userDegree) {
            matchPercent = Math.min(100, matchPercent + 5);
          }

          return {
            ...job,
            matchPercent
          };
        });

        /* SORT BEST FIRST (GREEDY) */
        results.sort((a, b) => b.matchPercent - a.matchPercent);

        res.json(results);
      });
    }
  );
});

module.exports = router;