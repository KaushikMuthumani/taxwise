import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, name, profession } = await req.json();

    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    // Save to Supabase
    const { error } = await supabaseAdmin
      .from("waitlist")
      .insert({ email, name, profession, source: "landing_page" });

    if (error && error.code !== "23505") { // 23505 = unique violation (already exists)
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send welcome email via Resend
    await resend.emails.send({
      from: "Taxwise <hello@taxwise.in>",
      to: email,
      subject: "You're on the Taxwise waitlist 🎉",
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; background: #0a0a0f; color: #e8e8f0;">
          <h2 style="color: #f5a623; font-size: 24px; margin-bottom: 16px;">You're on the list!</h2>
          <p style="color: #9898aa; line-height: 1.6; margin-bottom: 16px;">
            Thanks for joining the Taxwise waitlist. We're building the tax tool that Indian freelancers actually deserve — not another form-filling wizard.
          </p>
          <p style="color: #9898aa; line-height: 1.6; margin-bottom: 16px;">
            We'll email you as soon as we launch early access. You're one of the first.
          </p>
          <p style="color: #6b6b80; font-size: 13px; margin-top: 32px;">— Taxwise Team</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Waitlist error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
