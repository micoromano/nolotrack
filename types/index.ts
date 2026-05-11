export type TipoPagamento = "cash" | "carta" | "uber";

export interface Corsa {
  id: string;
  autista_id: string;
  data: string;
  ora_partenza: string;
  origine: string;
  destinazione: string;
  tipo_pagamento: TipoPagamento;
  importo: number;
  note?: string;
  created_at: string;
}

export interface Turno {
  id: string;
  autista_id: string;
  data: string;
  ora_inizio: string;
  ora_fine: string;
  ore_lavorate: number;
  note?: string;
  created_at: string;
}

export interface ConfigurazioneSalario {
  id: string;
  tariffa_oraria: number;
  percentuale_cash: number;
  percentuale_carta: number;
  percentuale_uber: number;
  aggiornato_il: string;
}

export interface ReportGiornaliero {
  data: string;
  ore_lavorate: number;
  corse: Corsa[];
  totale_cash: number;
  totale_carta: number;
  totale_uber: number;
  totale_generale: number;
}

export interface ReportMensile {
  anno: number;
  mese: number;
  giorni: ReportGiornaliero[];
  totale_ore: number;
  totale_cash: number;
  totale_carta: number;
  totale_uber: number;
  totale_generale: number;
  stipendio_base: number;
  stipendio_percentuali: number;
  stipendio_totale: number;
}
