import { NextRequest, NextResponse } from "next/server";
import { calculateTax, UserTaxProfile } from "@/lib/taxEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile = body as UserTaxProfile;

    if (!profile.profession || !profile.incomeSources) {
      return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
    }

    const result = calculateTax(profile);
    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error("Tax calculation error:", err);
    return NextResponse.json({ error: "Calculation failed" }, { status: 500 });
  }
}
