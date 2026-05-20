"use client";

import { useRouter } from "next/navigation";
import { CaretLeft, CaretRight, Download } from "@phosphor-icons/react";

export function AgendaNav({ anno, mese }: { anno: number; mese: number }) {
  const router = useRouter();

  function naviga(delta: number) {
    const d = new Date(anno, mese - 1 + delta, 1);
    router.push(`/dashboard/agenda?anno=${d.getFullYear()}&mese=${d.getMonth() + 1}`);
  }

  const label = new Date(anno, mese - 1).toLocaleDateString("it-IT", { month: "long", year: "numeric" });

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => naviga(-1)}
        className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
      >
        <CaretLeft size={14} weight="bold" />
      </button>
      <span className="text-sm font-semibold capitalize w-36 text-center">{label}</span>
      <button
        onClick={() => naviga(1)}
        className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
      >
        <CaretRight size={14} weight="bold" />
      </button>
    </div>
  );
}

export function IcalButton({ anno, mese }: { anno: number; mese: number }) {
  async function scarica() {
    const res = await fetch(`/api/agenda/ical?anno=${anno}&mese=${mese}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nolotrack-${anno}-${String(mese).padStart(2, "0")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={scarica}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted/30 transition-colors"
    >
      <Download size={13} weight="bold" />
      Esporta .ics
    </button>
  );
}

export function GoogleCalendarButton() {
  return (
    <a
      href="/api/google-calendar/connect"
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted/30 transition-colors"
    >
      Connetti Google Calendar
    </a>
  );
}
