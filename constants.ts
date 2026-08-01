export const POINTS_TO_REFILL = 10;

// A concept below this mastery % is flagged on the teacher dashboard and
// eligible for "Generate revision quiz".
export const WEAK_MASTERY_THRESHOLD = 70;

// Free-tier ceilings for teacher accounts. Teacher Pro (see
// actions/teacher-subscription.ts) lifts all three — checked against these
// only when the teacher has no active subscription.
export const FREE_TIER_LIMITS = {
  maxClasses: 3,
  maxAssignmentsPerClass: 5,
  maxUploadsPerClass: 2,
};

export const quests = [
  {
    title: "Earn 20 XP",
    value: 20,
  },
  {
    title: "Earn 50 XP",
    value: 50,
  },
  {
    title: "Earn 100 XP",
    value: 100,
  },
  {
    title: "Earn 500 XP",
    value: 500,
  },
  {
    title: "Earn 1000 XP",
    value: 1000,
  },
];
