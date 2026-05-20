import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

function formatEuro(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

const pagamentoBadgeStyle: Record<string, string> = {
  cash: "bg-amber-400/10 text-amber-400",
  carta: "bg-blue-400/10 text-blue-400",
  uber: "bg-muted text-muted-foreground",
  noninc: "bg-purple-400/10 text-purple-400",
};

const pagamentoLabel: Record<string, string> = {
  cash: "Cash",
  carta: "Carta",
  uber: "Uber",
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
    <div>
      {/* Command bar */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-card">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Corse</h1>
          <p className="text-xs text-muted-foreground">Ultime 50 corse registrate</p>
        </div>
        <Link href="/dashboard/corse/nuova" className={cn(buttonVariants({ size: "sm" }), "text-xs")}>
          + Nuova corsa
        </Link>
      </div>

      {/* Table */}
      <div className="p-6">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[120px_160px_80px_1fr_1fr_90px] px-4 py-2 border-b border-border bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data / Ora</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Partenza</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Destinazione</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Importo</span>
          </div>

          {!corse?.length && (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">
              Nessuna corsa registrata.
            </p>
          )}

          <div className="divide-y divide-border">
            {corse?.map((c) => (
              <Link key={c.id} href={`/dashboard/corse/${c.id}`} className="block hover:bg-muted/20 transition-colors cursor-pointer">
                {/* Desktop row */}
                <div className="hidden sm:grid grid-cols-[120px_160px_80px_1fr_1fr_90px] px-4 py-3 items-center gap-2">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {new Date(c.data).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
                    </p>
                    <p className="font-mono text-xs">{c.ora_partenza.slice(0, 5)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm truncate">{c.cliente_nome ?? <span className="text-muted-foreground/40 italic text-xs">—</span>}</p>
                    {c.n_pax && c.n_pax > 1 && (
                      <p className="text-xs text-muted-foreground">{c.n_pax} pax</p>
                    )}
                  </div>
                  <span className={cn("text-xs px-1.5 py-0.5 rounded-lg font-medium w-fit", pagamentoBadgeStyle[c.tipo_pagamento])}>
                    {pagamentoLabel[c.tipo_pagamento] ?? c.tipo_pagamento}
                  </span>
                  <span className="text-sm truncate">{c.origine}</span>
                  <span className="text-sm truncate">{c.destinazione}</span>
                  <span className="font-mono text-sm font-medium text-right">{formatEuro(c.importo)}</span>
                </div>

                {/* Mobile row */}
                <div className="sm:hidden px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">
                        {new Date(c.data).toLocaleDateString("it-IT", { day: "numeric", month: "short" })} · {c.ora_partenza.slice(0, 5)}
                      </span>
                      <span className={cn("text-xs px-1.5 py-0.5 rounded-lg font-medium", pagamentoBadgeStyle[c.tipo_pagamento])}>
                        {pagamentoLabel[c.tipo_pagamento] ?? c.tipo_pagamento}
                      </span>
                    </div>
                    <p className="text-sm truncate">{c.origine} → {c.destinazione}</p>
                  </div>
                  <span className="font-mono text-sm font-medium shrink-0">{formatEuro(c.importo)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
