export type Plan = "FREE_TRIAL" | "PRO" | "MAX" | "PREMIUM";

export const PLAN_LIMITS = {
  FREE_TRIAL: {
    decisionsPerMonth: 5,
    alerts: 0,
    privateRooms: 0,
    mentorRequestsPerMonth: 0,
    vipCommunity: false,
    anonymousVoting: false,
    leaderboard: false,
    whatWouldTheyDo: 0,
    historyDays: 7,
    enemyMode: false,
  },
  PRO: {
    decisionsPerMonth: 50,
    alerts: 3,
    privateRooms: 1,
    mentorRequestsPerMonth: 1,
    vipCommunity: false,
    anonymousVoting: false,
    leaderboard: true,
    whatWouldTheyDo: 3,
    historyDays: 30,
    enemyMode: true,
  },
  MAX: {
    decisionsPerMonth: -1, // unlimited
    alerts: -1,
    privateRooms: -1,
    mentorRequestsPerMonth: -1,
    vipCommunity: true,
    anonymousVoting: true,
    leaderboard: true,
    whatWouldTheyDo: 6,
    historyDays: -1, // forever
    enemyMode: true,
  },
  PREMIUM: {
    decisionsPerMonth: -1,
    alerts: -1,
    privateRooms: -1,
    mentorRequestsPerMonth: -1,
    vipCommunity: true,
    anonymousVoting: true,
    leaderboard: true,
    whatWouldTheyDo: 6,
    historyDays: -1,
    enemyMode: true,
  },
} as const;

export function canAccess(plan: Plan, feature: keyof typeof PLAN_LIMITS.FREE_TRIAL): boolean {
  const limit = PLAN_LIMITS[plan][feature];
  if (typeof limit === "boolean") return limit;
  if (typeof limit === "number") return limit !== 0;
  return false;
}

export function getLimit(plan: Plan, feature: keyof typeof PLAN_LIMITS.FREE_TRIAL): number {
  const limit = PLAN_LIMITS[plan][feature];
  if (typeof limit === "number") return limit;
  return 0;
}

export const PLAN_DISPLAY = {
  FREE_TRIAL: { label: "Free Trial", color: "text-[#888]" },
  PRO: { label: "Pro", color: "text-blue-400" },
  MAX: { label: "Max", color: "text-[#C9A84C]" },
  PREMIUM: { label: "Premium", color: "text-purple-400" },
};

export function planRank(plan: Plan): number {
  return { FREE_TRIAL: 0, PRO: 1, MAX: 2, PREMIUM: 3 }[plan];
}

// Early access: all plans are free during launch
export const EARLY_ACCESS = true;
