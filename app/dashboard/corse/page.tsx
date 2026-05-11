import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

const colori: Record<string, string> = {
  cash: "bg-green-100 text-green-800",
  carta: "bg-blue-100 text-blue-800",
  uber: "bg-black text-white",
};

function formatEuro(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Corse</h1>
        <Link href="/dashboard/corse/nuova" className={cn(buttonVariants())}>
          + Nuova corsa
        </Link>
      </div>

      <div className="space-y-2">
        {corse?.length === 0 && (
          <p className="text-muted-foreground text-sm">Nessuna corsa registrata.</p>
        )}
        {corse?.map((c) => (
          <Card key={c.id}>
            <CardContent className="py-3 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.data).toLocaleDateString("it-IT", { day: "numeric", month: "short" })} · {c.ora_partenza.slice(0,5)}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colori[c.tipo_pagamento]}`}>
                    {c.tipo_pagamento}
                  </span>
                </div>
                <p className="font-medium truncate">{c.origine} → {c.destinazione}</p>
              </div>
              <p className="font-bold text-lg shrink-0">{formatEuro(c.importo)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
