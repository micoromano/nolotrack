export type TipoPagamento = "cash" | "carta" | "uber" | "noninc";

export type StatoServizio = "da_iniziare" | "in_corso" | "attesa_pagamento" | "pagato" | "completato";

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
  // Flusso WhatsApp (SP7)
  stato_servizio?: StatoServizio;
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

// ─────────────────────────────────────────────────────
// WhatsApp (SP7 — Meta Cloud API)
// ─────────────────────────────────────────────────────
export type CategoriaTemplateWA = "autista" | "cliente" | "libero";
export type DestinatarioTipoWA = "autista" | "cliente";
export type DirezioneWA = "in" | "out";
export type TipoMessaggioWA = "testo" | "template" | "interactive_bottoni" | "interactive_lista" | "bottone_click";
export type StatoMessaggioWA = "inviato" | "consegnato" | "letto" | "errore" | "ricevuto";

export interface WhatsappTemplate {
  id: string;
  autista_id: string;
  nome: string;
  categoria: CategoriaTemplateWA;
  corpo: string;
  created_at: string;
}

export interface WhatsappLog {
  id: string;
  autista_id: string | null;
  corsa_id: string | null;
  destinatario_tipo: DestinatarioTipoWA | null;
  telefono: string;
  direzione: DirezioneWA;
  tipo: TipoMessaggioWA;
  contenuto: string | null;
  wa_message_id: string | null;
  stato: StatoMessaggioWA;
  errore_msg?: string | null;
  created_at: string;
}
