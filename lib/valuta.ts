import type { TipoPagamento, Valuta } from "@/types";

export const VALUTE: Valuta[] = ["EUR", "USD", "GBP", "CHF"];

/**
 * Equivalente in EUR di una corsa, calcolato al volo da importo * tasso_cambio
 * (tasso_cambio è sempre 1 quando valuta è EUR). `importo` resta sempre nella
 * valuta originale: questa funzione non va mai usata per riscrivere `importo`.
 */
export function eurEquivalent(corsa: { importo: number; valuta: Valuta | string; tasso_cambio: number }): number {
  return corsa.valuta === "EUR" ? corsa.importo : corsa.importo * corsa.tasso_cambio;
}

/**
 * Una corsa contribuisce al saldo cassa solo se è cash E "Includi in cassa" è
 * attivo — includi_in_cassa non sostituisce il filtro su tipo_pagamento, lo
 * affianca (vedi nota nella PR sull'interpretazione di questo campo).
 */
export function contribuisceACassa(corsa: { tipo_pagamento: TipoPagamento | string; includi_in_cassa: boolean }): boolean {
  return corsa.tipo_pagamento === "cash" && corsa.includi_in_cassa;
}

export function formatValuta(n: number, valuta: Valuta | string) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: valuta }).format(n);
}
