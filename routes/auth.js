const router = require("express").Router();
const passport = require("passport");
const db = require("../config/db");
const bcrypt = require("bcrypt");
const { sendLoginEmail } = require("../services/emailService");

/* =====================================================
   GOOGLE LOGIN
===================================================== */

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

/* =====================================================
   GOOGLE CALLBACK
===================================================== */

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:8080/login",
    session: true,
  }),
  async (req, res) => {
    try {
      if (req.user?.email) {
        await sendLoginEmail(req.user.email, req.user.name);
      }

      // Always redirect to profile-setup upon login so user can fill details
      res.redirect("http://localhost:8080/profile-setup");
    } catch (err) {
      console.error(err);
      res.redirect("http://localhost:8080/login");
    }
  }
);

/* =====================================================
   EMAIL REGISTER
===================================================== */

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: "Missing fields" });

  const hash = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users (name,email,password) VALUES (?,?,?)`,
    [name, email, hash],
    function (err) {
      if (err) return res.status(500).json(err);

      req.login(
        { id: this.lastID, name, email },
        () => res.json({ message: "Registered", user: req.user })
      );
    }
  );
});

/* =====================================================
   EMAIL LOGIN  ⭐ IMPORTANT
===================================================== */

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, user) => {
      if (err || !user)
        return res.status(401).json({ message: "Invalid credentials" });

      const valid = await bcrypt.compare(password, user.password);

      if (!valid)
        return res.status(401).json({ message: "Invalid credentials" });

      req.login(user, (err) => {
        if (err) return res.status(500).json(err);

        res.json({
          message: "Login success",
          user,
        });
      });
    }
  );
});

/* =====================================================
   LOGOUT
===================================================== */

router.get("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });
});

module.exports = router;