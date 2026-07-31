-- Casse in valute diverse (corse in USD/GBP/CHF oltre a EUR)
--
-- Aggiunge a `corse`:
--   valuta           — valuta originale dell'importo (EUR/USD/GBP/CHF), default EUR
--   tasso_cambio     — 1 unità di `valuta` in EUR, inserito manualmente dall'utente
--                      alla registrazione (nessun tasso automatico/di default)
--   includi_in_cassa — se true, l'equivalente EUR (importo * tasso_cambio) entra nel
--                      saldo cassa esattamente come un incasso cash; se false la corsa
--                      resta visibile ma è esclusa dal saldo cassa (come 'noninc' oggi)
--
-- `importo` continua a memorizzare la cifra nella valuta originale (mai pre-convertita):
-- l'equivalente EUR va calcolato al volo con importo * tasso_cambio (tasso_cambio = 1
-- quando valuta = EUR) ovunque serva un totale in EUR (cassa, stipendio, report).

ALTER TABLE public.corse
  ADD COLUMN IF NOT EXISTS valuta text NOT NULL DEFAULT 'EUR'
    CHECK (valuta IN ('EUR', 'USD', 'GBP', 'CHF'));

ALTER TABLE public.corse
  ADD COLUMN IF NOT EXISTS tasso_cambio numeric NOT NULL DEFAULT 1;

ALTER TABLE public.corse
  ADD COLUMN IF NOT EXISTS includi_in_cassa boolean NOT NULL DEFAULT true;
