import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function AdminUtentiPage() {
  const supabase = await createClient();
  const [autRes] = await Promise.allSettled([
    supabase.from("autisti").select("id, nome, email, ruoli(nome)").order("nome"),
  ]);
  const autisti = autRes.status === "fulfilled" ? autRes.value.data ?? [] : [];

  return (
    <div>
      <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-card">
        <div>
          <h1 className="text-sm font-semibold">Gestione autisti</h1>
          <p className="text-xs text-muted-foreground">{autisti.length} autisti registrati</p>
        </div>
        <Link href="/dashboard/admin/utenti/invita" className={cn(buttonVariants({ size: "sm" }), "text-xs")}>
          + Invita autista
        </Link>
      </div>
      <div className="p-6">
        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="grid grid-cols-3 px-4 py-2 border-b border-border bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ruolo</span>
          </div>
          <div className="divide-y divide-border">
            {autisti.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nessun autista registrato
              </div>
            )}
            {autisti.map((a) => (
              <div key={a.id} className="grid grid-cols-3 px-4 py-3 items-center hover:bg-muted/20 transition-colors">
                <span className="text-sm font-medium">{a.nome}</span>
                <span className="text-sm text-muted-foreground">{a.email}</span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded w-fit">
                  {(Array.isArray(a.ruoli) ? (a.ruoli as { nome: string }[])[0]?.nome : (a.ruoli as unknown as { nome: string } | null)?.nome) ?? "autista"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
