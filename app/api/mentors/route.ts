import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const industry = url.searchParams.get("industry");

  let query = supabaseAdmin
    .from("mentor_profiles")
    .select("*, reviews:mentor_reviews(rating)")
    .eq("status", "approved")
    .order("session_count", { ascending: false });

  if (industry) {
    query = query.eq("industry", industry);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = (data || []).map((m: Record<string, unknown> & { reviews: { rating: number }[] }) => {
    const reviews = m.reviews || [];
    const avgRating = reviews.length > 0 ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length : 0;
    return { ...m, avgRating: Math.round(avgRating * 10) / 10, reviewCount: reviews.length };
  });

  return NextResponse.json(result);
}
