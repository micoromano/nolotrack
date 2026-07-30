"use client";

import { useEffect, useState } from "react";
import { Bell, BellSlash } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function PushSubscribe({ className }: { className?: string }) {
  const [state, setState] = useState<"loading" | "unsupported" | "subscribed" | "unsubscribed">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "subscribed" : "unsubscribed");
    });
  }, []);

  async function toggleSubscription() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      if (state === "subscribed") {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setState("unsubscribed");
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });
        setState("subscribed");
      }
    } finally {
      setBusy(false);
    }
  }

  if (state === "unsupported" || state === "loading") return null;

  const active = state === "subscribed";
  return (
    <button
      onClick={toggleSubscription}
      disabled={busy}
      title={active ? "Disattiva notifiche push" : "Attiva notifiche push"}
      className={cn(
        "flex items-center gap-2 w-full px-1 py-1.5 text-xs transition-colors rounded disabled:opacity-50",
        active
          ? "text-primary hover:text-primary/80"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {active ? <Bell size={13} weight="fill" /> : <BellSlash size={13} weight="regular" />}
      {active ? "Notifiche attive" : "Attiva notifiche"}
    </button>
  );
}
