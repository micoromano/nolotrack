-- Gestione mance (tip handling)
--
-- Aggiunge alla tabella corse un campo "mancia": un importo separato dal
-- tipo_pagamento della corsa (cash/carta/uber/noninc), che rappresenta una
-- mancia ricevuta dal cliente con qualsiasi metodo. La mancia viene sempre
-- trattenuta in contanti dall'autista, quindi riduce il saldo cassa
-- (saldoOggi = saldoPrev + cashOggi - speseOggi - manceOggi) indipendentemente
-- da come è stata incassata la corsa. Non entra nel calcolo delle commissioni
-- stipendio, che restano basate solo su importo per tipo_pagamento.

ALTER TABLE corse ADD COLUMN mancia numeric NOT NULL DEFAULT 0;
