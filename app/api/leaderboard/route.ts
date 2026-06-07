import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Recalculate founder score for a user based on DB counts
async function recalcScore(userId: string): Promise<number> {
  const [decisions, pitches, onePagers, ideaValidations, compassSessions, investorEmails, messages, rooms, streakData] =
    await Promise.all([
      prisma.decision.count({ where: { userId } }),
      prisma.pitchBuild.count({ where: { userId } }),
      prisma.onePager.count({ where: { userId } }),
      prisma.ideaValidation.count({ where: { userId } }),
      prisma.compassSession.count({ where: { userId } }),
      prisma.investorEmail.count({ where: { userId } }),
      prisma.message.count({ where: { userId } }),
      prisma.roomMember.count({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { streakDays: true } }),
    ]);

  const streak = streakData?.streakDays ?? 0;
  const toolsUsed = [
    decisions > 0,
    pitches > 0,
    onePagers > 0,
    ideaValidations > 0,
    compassSessions > 0,
    investorEmails > 0,
  ].filter(Boolean).length;
  const community = messages + rooms;

  const streakScore = Math.min(streak * 10, 400);
  const decisionsScore = Math.min(decisions * 4, 200);
  const toolsScore = Math.min(toolsUsed * 33, 200);
  const communityScore = Math.min(community * 5, 200);

  return streakScore + decisionsScore + toolsScore + communityScore;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") ?? "global";

  // Update streak for current user
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { streakDays: true, lastActiveDate: true },
  });

  let newStreak = currentUser?.streakDays ?? 0;
  const lastActive = currentUser?.lastActiveDate;
  if (lastActive) {
    const lastStr = lastActive.toISOString().slice(0, 10);
    if (lastStr !== todayStr) {
      const diffMs = now.getTime() - lastActive.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      newStreak = diffDays === 1 ? newStreak + 1 : 1;
    }
  } else {
    newStreak = 1;
  }

  const newScore = await recalcScore(session.user.id);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { streakDays: newStreak, lastActiveDate: now, founderScore: newScore },
  });

  // Fetch leaderboard
  const where =
    filter === "country"
      ? { publicProfile: true, country: currentUser ? (await prisma.user.findUnique({ where: { id: session.user.id }, select: { country: true } }))?.country ?? undefined : undefined }
      : { publicProfile: true };

  const orderBy =
    filter === "streak"
      ? [{ streakDays: "desc" as const }, { founderScore: "desc" as const }]
      : filter === "week"
      ? [{ founderScore: "desc" as const }]
      : [{ founderScore: "desc" as const }, { streakDays: "desc" as const }];

  const leaders = await prisma.user.findMany({
    where,
    orderBy,
    take: 50,
    select: {
      id: true,
      name: true,
      country: true,
      streakDays: true,
      founderScore: true,
      createdAt: true,
      decisions: { select: { id: true } },
      pitchBuilds: { select: { id: true } },
      ideaValidations: { select: { id: true } },
      onePagers: { select: { id: true } },
      compassSessions: { select: { id: true } },
      investorEmails: { select: { id: true } },
      messages: { select: { id: true } },
    },
  });

  // Also always include current user (even if private) for their own card
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      country: true,
      streakDays: true,
      founderScore: true,
      createdAt: true,
      decisions: { select: { id: true } },
      pitchBuilds: { select: { id: true } },
      ideaValidations: { select: { id: true } },
      onePagers: { select: { id: true } },
      compassSessions: { select: { id: true } },
      investorEmails: { select: { id: true } },
      messages: { select: { id: true } },
    },
  });

  const toEntry = (u: typeof me, rank: number) => {
    if (!u) return null;
    const toolsUsed = [
      u.decisions.length > 0,
      u.pitchBuilds.length > 0,
      u.ideaValidations.length > 0,
      u.onePagers.length > 0,
      u.compassSessions.length > 0,
      u.investorEmails.length > 0,
    ].filter(Boolean).length;
    const topTool = u.pitchBuilds.length > 0 ? "Pitch Builder"
      : u.ideaValidations.length > 0 ? "Idea Validator"
      : u.onePagers.length > 0 ? "One Pager"
      : u.compassSessions.length > 0 ? "Compass"
      : u.decisions.length > 0 ? "Decision Maker"
      : "Explorer";

    return {
      id: u.id,
      rank,
      country: u.country ?? "Unknown",
      streakDays: u.streakDays,
      founderScore: u.founderScore,
      decisionsCount: u.decisions.length,
      toolsUsed,
      topTool,
      messagesCount: u.messages.length,
      joinedAt: u.createdAt,
      isMe: u.id === session.user.id,
    };
  };

  const leaderEntries = leaders.map((u, i) => toEntry(u, i + 1)!);

  // Find user's rank in global list (may not be in top 50)
  const allPublic = await prisma.user.findMany({
    where: { publicProfile: true },
    orderBy: [{ founderScore: "desc" }, { streakDays: "desc" }],
    select: { id: true },
  });
  const myGlobalRank = allPublic.findIndex((u) => u.id === session.user.id) + 1 || allPublic.length + 1;

  return NextResponse.json({
    leaders: leaderEntries,
    me: me ? toEntry(me, myGlobalRank) : null,
    myStreak: newStreak,
  });
}
