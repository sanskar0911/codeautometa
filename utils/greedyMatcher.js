function skillScore(userSkills, requiredSkills) {
  if (!requiredSkills.length) return 0;

  const matches = requiredSkills.filter(skill =>
    userSkills.includes(skill.toLowerCase())
  );

  return matches.length / requiredSkills.length;
}

function educationScore(userDegree, requiredDegree) {
  if (!requiredDegree) return 1;

  return userDegree
    ?.toLowerCase()
    .includes(requiredDegree.toLowerCase())
    ? 1
    : 0.5;
}

function experienceScore(userExp, minExp) {
  if (userExp >= minExp) return 1;
  return userExp / (minExp || 1);
}

/* ===== GREEDY MATCH ===== */

function greedyMatch(user, internships) {
  return internships
    .map((internship) => {
      const sScore = skillScore(user.skills, internship.skills);
      const eScore = educationScore(user.degree, internship.degree);
      const xScore = experienceScore(
        user.experience,
        internship.min_experience
      );

      const finalScore =
        sScore * 0.6 +
        eScore * 0.25 +
        xScore * 0.15;

      return {
        ...internship,
        score: Math.round(finalScore * 100),
      };
    })
    .sort((a, b) => b.score - a.score);
}

module.exports = greedyMatch;