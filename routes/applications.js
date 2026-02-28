const router = require("express").Router();
const db = require("../config/db");
const { sendLoginEmail } = require("../services/emailService");

/* =====================================================
   SKILL MATCH CALCULATOR
===================================================== */
function calculateMatch(userSkills, internshipSkills) {
  if (!userSkills || !internshipSkills) return 0;

  const user = userSkills
    .toLowerCase()
    .split(",")
    .map(s => s.trim());

  const job = internshipSkills
    .toLowerCase()
    .split(",")
    .map(s => s.trim());

  const matched = job.filter(skill => user.includes(skill));

  return Math.round((matched.length / job.length) * 100);
}

/* =====================================================
   GET USER APPLICATIONS
===================================================== */
router.get("/applications", (req, res) => {
  if (!req.user)
    return res.status(401).json({ message: "Not logged in" });

  db.all(
    `SELECT a.*, i.title, i.company, i.skills as internship_skills, u.skills as user_skills, u.experience, u.degree
     FROM applications a
     JOIN internships i ON a.internship_id = i.id
     LEFT JOIN user_profiles u ON a.user_id = u.user_id
     WHERE a.user_id = ?`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json(err);

      const enrichedRows = rows.map(row => {
        let matchPercent = calculateMatch(row.user_skills || "", row.internship_skills || "");

        // Enhance with experience and degree if available
        if (row.experience > 0) {
          matchPercent = Math.min(100, matchPercent + (row.experience * 5));
        }
        if (row.degree) {
          matchPercent = Math.min(100, matchPercent + 5);
        }

        return {
          ...row,
          matchPercent,
        };
      });
      res.json(enrichedRows);
    }
  );
});

/* =====================================================
   APPLY INTERNSHIP
===================================================== */
router.post("/apply", (req, res) => {
  if (!req.user)
    return res.status(401).json({ message: "Not logged in" });

  const { internship_id } = req.body;

  /* GET USER */
  db.get(
    "SELECT * FROM users WHERE id=?",
    [req.user.id],
    (err, user) => {
      if (!user) return res.status(404).json({ message: "User not found" });

      /* GET PROFILE */
      db.get(
        "SELECT * FROM user_profiles WHERE user_id=?",
        [req.user.id],
        (err, profile) => {

          const userSkills = profile?.skills || "";

          /* GET INTERNSHIP */
          db.get(
            "SELECT * FROM internships WHERE id=?",
            [internship_id],
            async (err, internship) => {

              if (!internship)
                return res.status(404).json({
                  message: "Internship not found",
                });

              /* CALCULATE MATCH */
              const matchPercent = calculateMatch(
                userSkills,
                internship.skills
              );

              const status =
                matchPercent >= 80 ? "Accepted" : "Rejected";

              /* SAVE APPLICATION */
              db.run(
                `INSERT INTO applications
                (internship_id,user_id,student_name,email,skills,status)
                VALUES (?,?,?,?,?,?)`,
                [
                  internship_id,
                  req.user.id,
                  user.name,
                  user.email,
                  userSkills,
                  status,
                ],
                async function (err) {
                  if (err) return res.status(500).json(err);

                  /* SEND EMAIL */
                  try {
                    const message =
                      status === "Accepted"
                        ? `🎉 Congratulations ${user.name}!

You are ACCEPTED for ${internship.title}.
Skill Match: ${matchPercent}%`
                        : `Hello ${user.name},

Your application for ${internship.title} was not selected.

Skill Match: ${matchPercent}%
Keep improving and try again!`;

                    await sendLoginEmail(user.email, message);
                  } catch (e) {
                    console.log("Email error:", e);
                  }

                  res.json({
                    message: "Application submitted ✅",
                    matchPercent,
                    status,
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});
/* =====================================================
   ADMIN: GET ALL APPLICATIONS
===================================================== */
router.get("/admin/applications", (req, res) => {
  db.all(
    `SELECT a.*, i.title, i.company, u.skills as user_skills, u.experience, u.degree
     FROM applications a
     JOIN internships i ON a.internship_id = i.id
     LEFT JOIN user_profiles u ON a.user_id = u.user_id`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

/* =====================================================
   ADMIN: UPDATE STATUS
===================================================== */
router.post("/admin/applications/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.run(
    `UPDATE applications SET status = ? WHERE id = ?`,
    [status, id],
    function (err) {
      if (err) return res.status(500).json(err);

      // Fetch details to send email
      db.get(
        `SELECT a.student_name, a.email, i.title, i.company
         FROM applications a
         JOIN internships i ON a.internship_id = i.id
         WHERE a.id = ?`,
        [id],
        async (err, app) => {
          if (!err && app && app.email) {
            try {
              const message = status === "Accepted"
                ? `🎉 Congratulations ${app.student_name}!\n\nAfter review, the Admin has ACCEPTED your application for ${app.title} at ${app.company}.`
                : `Hello ${app.student_name},\n\nWe regret to inform you that your application for ${app.title} at ${app.company} was not selected by the Admin after review.\n\nKeep improving and try again!`;

              await sendLoginEmail(app.email, message);
            } catch (e) {
              console.error("Admin Email error:", e);
            }
          }
          res.json({ message: "Status updated and email sent", status });
        }
      );
    }
  );
});

module.exports = router;