const sqlite3 = require("sqlite3").verbose();

/* ===============================
   CONNECT DATABASE
================================ */

const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("❌ DB Connection Error:", err);
  } else {
    console.log("✅ SQLite Connected");
  }
});

/* ===============================
   USERS TABLE
================================ */
db.run(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id TEXT UNIQUE,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT
)
`);

/* ===============================
   USER PROFILE (AI MATCH DATA)
================================ */
db.run(`
CREATE TABLE IF NOT EXISTS user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE,
  college TEXT,
  degree TEXT,
  skills TEXT,
  experience INTEGER,
  FOREIGN KEY(user_id) REFERENCES users(id)
)
`);

/* ===============================
   RESUMES TABLE
================================ */
db.run(`
CREATE TABLE IF NOT EXISTS resumes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  resume_path TEXT,
  skills TEXT,
  education TEXT,
  experience TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
)
`);

/* ===============================
   INTERNSHIPS TABLE
================================ */
db.run(`
CREATE TABLE IF NOT EXISTS internships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  company TEXT,
  stipend TEXT,
  location TEXT,
  skills TEXT
)
`);

/* ===============================
   APPLICATIONS TABLE
================================ */
db.run(`
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  internship_id INTEGER,
  user_id INTEGER,
  student_name TEXT,
  email TEXT,
  phone TEXT,
  skills TEXT,
  status TEXT DEFAULT 'Waitlist',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
)
`);
db.get("SELECT COUNT(*) as count FROM internships", (err, row) => {
  if (row.count === 0) {
    console.log("🌱 Seeding internships...");

    const internships = [
      ["Product Management Intern", "Razorpay", "Bangalore", "₹6,000/mo", "Product Strategy,SQL,Analytics"],
      ["Product Analyst Intern", "Ola", "Mumbai", "₹3,500/mo", "Python,Data Viz,SQL"],
      ["Data Analyst Intern", "DataCorp", "Mumbai", "₹12,000/month", "SQL,Python,Power BI"],
      ["Product Ops Intern", "Zerodha", "Bangalore", "₹4,000/mo", "Operations,SQL,Documentation"],
      ["Growth PM Intern", "Meesho", "Delhi", "₹5,500/mo", "Growth Hacking,A/B Testing,Analytics"],
      ["Technical PM Intern", "Flipkart", "Bangalore", "₹7,500/mo", "API Design,SQL,System Design"],
      ["AI Engineer Intern", "OpenAI Labs", "Remote", "₹25,000/month", "Python,Machine Learning,TensorFlow"],
      ["APM Intern", "Swiggy", "Bangalore", "₹5,000/mo", "Agile,User Research,Figma"],
      ["Business Strategy Intern", "CRED", "Mumbai", "₹8,000/mo", "Market Research,Data Analysis,Excel"],
      ["PM Intern – Fintech", "PhonePe", "Pune", "₹7,000/mo", "Fintech,Product Roadmap,Jira"],
      ["UX Research Intern", "Zomato", "Gurugram", "₹4,500/mo", "User Testing,Surveys,Figma"],
      ["Strategy Intern", "Paytm", "Noida", "₹5,000/mo", "Strategy,Competitive Analysis,Excel"],
      ["Full Stack Developer Intern", "TechNova", "Bangalore", "₹15,000/month", "React,Node.js,MongoDB"]
    ];

    internships.forEach(i => {
      db.run(
        `INSERT INTO internships(title,company,location,stipend,skills)
         VALUES(?,?,?,?,?)`,
        i
      );
    });
  }
});
module.exports = db;