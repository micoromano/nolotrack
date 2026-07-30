"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus } from "@phosphor-icons/react";

const inputClass =
  "w-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export default function InvitaAutistaPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [messaggio, setMessaggio] = useState<{ tipo: "ok" | "errore"; testo: string } | null>(null);

  async function invita(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessaggio(null);
    const res = await fetch("/api/admin/invita", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nome }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessaggio({ tipo: "ok", testo: `Invito inviato a ${email}` });
      setEmail("");
      setNome("");
    } else {
      setMessaggio({ tipo: "errore", testo: data.error ?? "Errore sconosciuto" });
    }
  }

  return (
    <div>
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center gap-3 px-4 md:px-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} weight="bold" /> Admin
        </button>
        <span className="text-on-surface-variant text-xs">/</span>
        <h1 className="font-heading text-lg font-bold text-primary">Invita autista</h1>
      </header>
      <div className="px-4 md:px-10 py-8">
        <div className="max-w-md glass-card rounded-2xl">
          <div className="border-b border-border-subtle px-5 py-3">
            <p className="text-xs text-on-surface-variant">
              L&apos;autista riceverà una email con il link di registrazione.
            </p>
          </div>
          <form onSubmit={invita} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Nome
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                placeholder="Mario Rossi"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="mario@esempio.it"
                className={inputClass}
              />
            </div>
            {messaggio && (
              <p className={`text-sm ${messaggio.tipo === "ok" ? "text-emerald-400" : "text-destructive"}`}>
                {messaggio.testo}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                <UserPlus size={15} weight="fill" />
                {loading ? "Invio…" : "Invia invito"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-muted text-foreground text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-muted/70"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
