const router = require("express").Router();
const db = require("../config/db");

/* ===============================
   GET ALL INTERNSHIPS
================================ */

router.get("/internships", (req, res) => {
  db.all("SELECT * FROM internships", [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "DB error" });
    }

    res.json(rows);
  });
});

module.exports = router;