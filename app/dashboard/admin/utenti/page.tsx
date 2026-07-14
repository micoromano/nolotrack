import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowLeft, UserPlus, Users } from "@phosphor-icons/react/dist/ssr";

export default async function AdminUtentiPage() {
  const supabase = await createClient();
  const [autRes] = await Promise.allSettled([
    supabase.from("autisti").select("id, nome, email, ruoli(nome)").order("nome"),
  ]);
  const autisti = autRes.status === "fulfilled" ? autRes.value.data ?? [] : [];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center justify-between px-4 md:px-10">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin"
            className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-foreground transition-colors"
          >
            <ArrowLeft size={13} weight="bold" /> Admin
          </Link>
          <span className="text-on-surface-variant text-xs">/</span>
          <h1 className="font-heading text-lg font-bold text-primary">Autisti</h1>
        </div>
        <Link
          href="/dashboard/admin/utenti/invita"
          className={cn(buttonVariants({ size: "sm" }), "gap-1.5 text-xs")}
        >
          <UserPlus size={14} weight="bold" />
          Invita autista
        </Link>
      </header>

      <div className="px-4 md:px-10 py-8 max-w-[1440px] mx-auto space-y-6">
        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          {autisti.length} autisti registrati
        </p>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-3 px-6 py-3 border-b border-border-subtle bg-surface-container-low/50">
            {["Nome", "Email", "Ruolo"].map((h) => (
              <span key={h} className="text-[11px] font-bold uppercase tracking-wider text-on-secondary-container">
                {h}
              </span>
            ))}
          </div>

          {autisti.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Users size={32} weight="light" className="text-on-surface-variant mx-auto mb-3" />
              <p className="text-sm text-on-surface-variant">Nessun autista registrato.</p>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {autisti.map((a) => {
                const ruolo =
                  (Array.isArray(a.ruoli)
                    ? (a.ruoli as { nome: string }[])[0]?.nome
                    : (a.ruoli as unknown as { nome: string } | null)?.nome) ?? "autista";
                return (
                  <div key={a.id} className="hover:bg-surface-variant/20 transition-colors">
                    <div className="hidden sm:grid grid-cols-3 px-6 py-4 items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{a.nome}</span>
                      <span className="text-sm text-on-surface-variant truncate">{a.email}</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase w-fit">
                        {ruolo}
                      </span>
                    </div>
                    <div className="sm:hidden px-4 py-3 space-y-1.5">
                      <p className="text-sm font-medium text-foreground">{a.nome}</p>
                      <p className="text-xs text-on-surface-variant truncate">{a.email}</p>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase w-fit">
                        {ruolo}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
