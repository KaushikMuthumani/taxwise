// src/app/api/waitlist/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase"; // keep this import if that's where you export it

type WaitlistBody = {
  email?: string;
  name?: string;
  profession?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    // ✅ If admin client is not configured, don't crash build/runtime silently
    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          error:
            "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it in Vercel Environment Variables.",
        },
        { status: 500 }
      );
    }

    const body = (await req.json()) as WaitlistBody;

    const email = (body.email ?? "").trim().toLowerCase();
    const name = (body.name ?? "").trim();
    const profession = (body.profession ?? "").trim();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    // Save to Supabase
    const { error } = await supabaseAdmin
      .from("waitlist")
      .insert({ email, name: name || null, profession: profession || null, source: "landing_page" });

    if (error) {
      // If duplicate email constraint exists
      if (error.code === "23505") {
        return NextResponse.json({ ok: true, message: "Already on waitlist" }, { status: 200 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}