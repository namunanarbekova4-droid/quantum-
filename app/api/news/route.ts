import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchNewsByRole } from "@/lib/apis/news";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session as { user: { role?: string } }).user?.role ?? "FOUNDER";
  const articles = await fetchNewsByRole(role);
  return NextResponse.json(articles);
}
