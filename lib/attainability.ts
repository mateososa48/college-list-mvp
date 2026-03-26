export type Attainability = "Reach" | "Target" | "Safety";

interface SchoolStats {
  sat_25th: number | null;
  sat_75th: number | null;
  avg_gpa: number | null;
  acceptance_rate: number | null;
}

export function classify(
  userSAT: number | null,
  userGPA: number | null,
  school: SchoolStats
): Attainability {
  let satClass: Attainability = "Target";
  let gpaClass: Attainability = "Target";

  // SAT classification (vs school's 25th/75th percentile)
  if (userSAT && school.sat_25th && school.sat_75th) {
    if (userSAT >= school.sat_75th) satClass = "Safety";
    else if (userSAT <= school.sat_25th) satClass = "Reach";
  }

  // GPA classification (approximate bands around avg_gpa)
  if (userGPA && school.avg_gpa) {
    if (userGPA >= school.avg_gpa + 0.15) gpaClass = "Safety";
    else if (userGPA <= school.avg_gpa - 0.3) gpaClass = "Reach";
  }

  // Acceptance rate fallback: if very selective and no score data, lean Reach
  if (!school.sat_25th && !school.avg_gpa && school.acceptance_rate !== null) {
    if (school.acceptance_rate < 0.1) return "Reach";
    if (school.acceptance_rate > 0.5) return "Safety";
  }

  // Take the harder classification
  if (satClass === "Reach" || gpaClass === "Reach") return "Reach";
  if (satClass === "Safety" && gpaClass === "Safety") return "Safety";
  return "Target";
}
