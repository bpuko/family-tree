import { withSupabase } from "@supabase/server";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    // This check uses the caller-scoped client; members can only read their own row.
    const { data: membership, error: membershipError } = await ctx.supabase
      .from("family_members")
      .select("role")
      .eq("user_id", ctx.userClaims.id)
      .maybeSingle();
    if (membershipError || membership?.role !== "owner") {
      return Response.json({ error: "Only the family owner can invite members" }, { status: 403 });
    }

    let email = "";
    try {
      const body = await req.json();
      email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    } catch {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Enter a valid email address" }, { status: 400 });
    }

    const appUrl = "https://bpuko.github.io/family-tree/";

    // Admin credentials are supplied by Supabase's Edge Function runtime and never reach the browser.
    const { data: invited, error: inviteError } = await ctx.supabaseAdmin.auth.admin
      .inviteUserByEmail(email, { redirectTo: appUrl });
    if (inviteError || !invited.user) {
      return Response.json({ error: inviteError?.message || "Could not send invitation" }, { status: 400 });
    }

    const { error: insertError } = await ctx.supabaseAdmin.from("family_members").upsert({
      user_id: invited.user.id,
      email,
      role: "editor",
    });
    if (insertError) {
      return Response.json({ error: "Invite sent, but access could not be assigned. Ask the owner to contact support." }, { status: 500 });
    }
    return Response.json({ ok: true });
  }),
};

