import { createClient } from "@/lib/supabase/server";
import webpush from "web-push";
import { NextResponse } from "next/server";

webpush.setVapidDetails(
  "mailto:" + (process.env.GMAIL_USER ?? "admin@nolotrack.app"),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { title, body, url, tag } = await req.json();

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("autista_id", user.id);

  if (!subs?.length) return NextResponse.json({ ok: true, sent: 0 });

  const payload = JSON.stringify({ title, body, url: url ?? "/dashboard", tag });

  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      )
    )
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length) {
    // rimuovi subscription scadute
    const expiredEndpoints = subs
      .filter((_, i) => results[i].status === "rejected")
      .map((s) => s.endpoint);
    await supabase.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);
  }

  return NextResponse.json({ ok: true, sent: results.length - failed.length });
}
