import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Data in formato YYYY-MM-DD secondo il fuso orario LOCALE.
 * NON usare `d.toISOString().split("T")[0]`: converte in UTC e in Italia
 * (UTC+1/+2) la mezzanotte locale diventa il giorno precedente
 * (es. il 31 diventa il 30 → l'ultimo giorno del mese veniva escluso).
 */
export function isoDataLocale(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Primo e ultimo giorno (inclusi) di un mese "YYYY-MM". */
export function rangeMese(mese: string): { inizio: string; fine: string } {
  const [anno, m] = mese.split("-").map(Number);
  const ultimo = new Date(anno, m, 0).getDate();
  return { inizio: `${mese}-01`, fine: `${mese}-${String(ultimo).padStart(2, "0")}` };
}
