import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Plus, Car } from "@phosphor-icons/react/dist/ssr";

function formatEuro(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

const pagamentoBadgeStyle: Record<string, string> = {
  cash:   "bg-amber-400/10 text-amber-400 border border-amber-400/20",
  carta:  "bg-blue-400/10 text-blue-400 border border-blue-400/20",
  uber:   "bg-slate-400/10 text-slate-400 border border-slate-400/20",
  noninc: "bg-purple-400/10 text-purple-400 border border-purple-400/20",
};

const pagamentoLabel: Record<string, string> = {
  cash:   "Cash",
  carta:  "Carta",
  uber:   "Uber",
  noninc: "No Inc",
};

export default async function CorsePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: corse } = await supabase
    .from("corse")
    .select("*")
    .eq("autista_id", user!.id)
    .order("data", { ascending: false })
    .order("ora_partenza", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center justify-between px-4 md:px-10">
        <div>
          <h1 className="font-heading text-lg font-bold text-primary">Corse</h1>
          <p className="text-xs text-on-surface-variant">Ultime 50 corse registrate</p>
        </div>
        <Link href="/dashboard/corse/nuova" className={cn(buttonVariants({ size: "sm" }), "gap-1.5 text-xs font-bold uppercase tracking-wide shadow-lg shadow-primary/20")}>
          <Plus size={14} weight="bold" />
          Nuova corsa
        </Link>
      </header>

      <div className="px-4 md:px-10 py-8 max-w-[1440px] mx-auto">
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[120px_100px_80px_1fr_1fr_100px] px-6 py-3 border-b border-border-subtle bg-surface-container-low/50">
            {["Data / Ora", "Cliente", "Tipo", "Partenza", "Destinazione", "Importo"].map(h => (
              <span key={h} className="text-[11px] font-bold uppercase tracking-wider text-on-secondary-container">{h}</span>
            ))}
          </div>

          {!corse?.length && (
            <div className="px-6 py-16 text-center">
              <Car size={32} weight="light" className="text-on-surface-variant mx-auto mb-3" />
              <p className="text-sm text-on-surface-variant">Nessuna corsa registrata.</p>
            </div>
          )}

          <div className="divide-y divide-border-subtle">
            {corse?.map((c) => (
              <Link key={c.id} href={`/dashboard/corse/${c.id}`} className="block hover:bg-surface-variant/20 transition-colors cursor-pointer">
                {/* Desktop row */}
                <div className="hidden sm:grid grid-cols-[120px_100px_80px_1fr_1fr_100px] px-6 py-4 items-center gap-2">
                  <div>
                    <p className="font-mono text-xs text-on-surface-variant">
                      {new Date(c.data).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
                    </p>
                    <p className="font-mono text-xs font-semibold text-foreground">{c.ora_partenza.slice(0, 5)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {c.cliente_nome ?? <span className="text-on-surface-variant/40 italic text-xs">—</span>}
                    </p>
                    {c.n_pax && c.n_pax > 1 && (
                      <p className="text-xs text-on-surface-variant">{c.n_pax} pax</p>
                    )}
                  </div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase w-fit", pagamentoBadgeStyle[c.tipo_pagamento])}>
                    {pagamentoLabel[c.tipo_pagamento] ?? c.tipo_pagamento}
                  </span>
                  <span className="text-sm text-foreground truncate">{c.origine}</span>
                  <span className="text-sm text-on-surface-variant truncate">{c.destinazione}</span>
                  <span className="font-mono text-sm font-bold text-right text-success-emerald">{formatEuro(c.importo)}</span>
                </div>

                {/* Mobile row */}
                <div className="sm:hidden px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-on-surface-variant">
                        {new Date(c.data).toLocaleDateString("it-IT", { day: "numeric", month: "short" })} · {c.ora_partenza.slice(0, 5)}
                      </span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase", pagamentoBadgeStyle[c.tipo_pagamento])}>
                        {pagamentoLabel[c.tipo_pagamento] ?? c.tipo_pagamento}
                      </span>
                    </div>
                    <p className="text-sm text-foreground truncate">{c.origine} → {c.destinazione}</p>
                  </div>
                  <span className="font-mono text-sm font-bold text-success-emerald shrink-0">{formatEuro(c.importo)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
