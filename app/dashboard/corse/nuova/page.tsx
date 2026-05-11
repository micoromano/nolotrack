"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TipoPagamento } from "@/types";

export default function NuovaCorsaPage() {
  const oggi = new Date().toISOString().split("T")[0];
  const oraAdesso = new Date().toTimeString().slice(0, 5);

  const [data, setData] = useState(oggi);
  const [oraPartenza, setOraPartenza] = useState(oraAdesso);
  const [origine, setOrigine] = useState("");
  const [destinazione, setDestinazione] = useState("");
  const [tipoPagamento, setTipoPagamento] = useState<TipoPagamento>("cash");
  const [importo, setImporto] = useState("");
  const [note, setNote] = useState("");
  const [errore, setErrore] = useState("");
  const [caricamento, setCaricamento] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    setErrore("");
    setCaricamento(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("corse").insert({
      autista_id: user!.id,
      data,
      ora_partenza: oraPartenza,
      origine,
      destinazione,
      tipo_pagamento: tipoPagamento,
      importo: parseFloat(importo) || 0,
      note: note || null,
    });

    if (error) {
      setErrore("Errore nel salvataggio: " + error.message);
      setCaricamento(false);
      return;
    }

    router.push("/dashboard/corse");
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Nuova corsa</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={salva} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="data">Data</Label>
                <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ora">Ora partenza</Label>
                <Input id="ora" type="time" value={oraPartenza} onChange={(e) => setOraPartenza(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="origine">Partenza</Label>
              <Input id="origine" placeholder="es. Milano Centrale" value={origine} onChange={(e) => setOrigine(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dest">Destinazione</Label>
              <Input id="dest" placeholder="es. Aeroporto Malpensa" value={destinazione} onChange={(e) => setDestinazione(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Pagamento</Label>
                <Select value={tipoPagamento} onValueChange={(v) => setTipoPagamento(v as TipoPagamento)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="carta">Carta</SelectItem>
                    <SelectItem value="uber">Uber</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="importo">Importo (€)</Label>
                <Input
                  id="importo"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={importo}
                  onChange={(e) => setImporto(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="note">Note (opzionale)</Label>
              <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            {errore && <p className="text-sm text-red-500">{errore}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={caricamento} className="flex-1">
                {caricamento ? "Salvataggio..." : "Salva"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annulla
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
