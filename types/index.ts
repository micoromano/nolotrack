export type TipoPagamento = "cash" | "carta" | "uber" | "noninc";

export interface Corsa {
  id: string;
  autista_id: string;
  data: string;
  ora_partenza: string;
  origine: string;
  destinazione: string;
  tipo_pagamento: TipoPagamento;
  importo: number;
  note?: string | null;
  created_at: string;
  // Campi ordine servizio (SP1)
  n_ordine?: number | null;
  anno_ordine?: number | null;
  rif_agenzia?: string | null;
  agenzia?: string | null;
  cliente_nome?: string | null;
  cliente_tel?: string | null;
  n_pax?: number;
  ora_fine?: string | null;
  tipo_servizio?: string | null;
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

export interface Spesa {
  id: string;
  autista_id: string;
  data: string;
  descrizione: string;
  importo: number;
  created_at: string;
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
