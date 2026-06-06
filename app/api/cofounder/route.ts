import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { cofounderProfile: true },
    });

    // Count total active profiles
    const count = await prisma.cofounderProfile.count({ where: { isActive: true } });

    return NextResponse.json({
      profile: user?.cofounderProfile || null,
      totalFounders: count,
    });
  } catch (err) {
    console.error("cofounder GET error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      skills, neededSkills, ideaDescription, stage,
      commitment, locationPref, equityExpectation, workStyle,
    } = body;

    const profile = await prisma.cofounderProfile.upsert({
      where: { userId: user.id },
      update: {
        skills,
        neededSkills,
        ideaDescription,
        stage,
        commitment,
        locationPref,
        equityExpectation,
        workStyle,
        isActive: true,
      },
      create: {
        userId: user.id,
        skills,
        neededSkills,
        ideaDescription,
        stage,
        commitment,
        locationPref,
        equityExpectation,
        workStyle,
      },
    });

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("cofounder POST error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
