
const router = require("express").Router();

router.get("/user", (req, res) => {
  if (!req.user) {
    return res.json({ name: "Guest", role: "Student" });
  }
  res.json(req.user);
});

module.exports = router;
