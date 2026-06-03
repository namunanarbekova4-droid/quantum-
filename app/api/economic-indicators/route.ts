import { NextResponse } from "next/server";
import { getEconomicIndicators } from "@/lib/apis/world-bank";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country") || "US";
  const data = await getEconomicIndicators(country);
  return NextResponse.json(data);
}
