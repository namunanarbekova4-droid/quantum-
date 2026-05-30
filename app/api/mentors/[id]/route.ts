import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: mentor, error } = await supabaseAdmin
    .from("mentor_profiles")
    .select("*, reviews:mentor_reviews(*)")
    .eq("id", params.id)
    .eq("status", "approved")
    .single();

  if (error || !mentor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const reviews = mentor.reviews || [];
  const avgRating = reviews.length > 0 ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length : 0;

  return NextResponse.json({ ...mentor, avgRating: Math.round(avgRating * 10) / 10, reviewCount: reviews.length });
}
