import { describe, it, expect } from "vitest";

// ── Funzioni da testare (estratte o replicate da lib/) ──

function formatEuro(n: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

function calcolaStipendio({
  oreLavorate,
  tariffaOraria,
  totaleCash,
  totaleCarta,
  totaleUber,
  percCash,
  percCarta,
  percUber,
}: {
  oreLavorate: number;
  tariffaOraria: number;
  totaleCash: number;
  totaleCarta: number;
  totaleUber: number;
  percCash: number;
  percCarta: number;
  percUber: number;
}): number {
  const base = oreLavorate * tariffaOraria;
  const commCash = totaleCash * percCash;
  const commCarta = totaleCarta * percCarta;
  const commUber = totaleUber * percUber;
  return base + commCash + commCarta + commUber;
}

function calcolaSaldo(
  corse: { data: string; tipo_pagamento: string; importo: number }[],
  spese: { data: string; importo: number }[],
  fino: string,
): number {
  const cashEntrate = corse
    .filter((c) => c.tipo_pagamento === "cash" && c.data <= fino)
    .reduce((acc, c) => acc + c.importo, 0);
  const uscite = spese
    .filter((s) => s.data <= fino)
    .reduce((acc, s) => acc + s.importo, 0);
  return cashEntrate - uscite;
}

// ── Test suite ──

describe("formatEuro", () => {
  // Normalizziamo lo spazio prima di € perché jsdom usa U+202F (narrow no-break space)
  // invece di U+00A0, e i separatori migliaia dipendono dalla versione ICU.
  const normalize = (s: string) => s.replace(/[  ]/g, " ");

  it("formatta zero", () => {
    expect(normalize(formatEuro(0))).toBe("0,00 €");
  });
  it("formatta importo positivo", () => {
    expect(normalize(formatEuro(120.5))).toBe("120,50 €");
  });
  it("formatta importo con migliaia", () => {
    const result = normalize(formatEuro(1250));
    expect(result).toContain("1250");
    expect(result).toContain("€");
  });
});

describe("calcolaStipendio", () => {
  it("calcola stipendio base senza commissioni", () => {
    const s = calcolaStipendio({
      oreLavorate: 8,
      tariffaOraria: 10,
      totaleCash: 0,
      totaleCarta: 0,
      totaleUber: 0,
      percCash: 0.35,
      percCarta: 0.35,
      percUber: 0.35,
    });
    expect(s).toBe(80);
  });

  it("calcola commissioni cash", () => {
    const s = calcolaStipendio({
      oreLavorate: 0,
      tariffaOraria: 10,
      totaleCash: 100,
      totaleCarta: 0,
      totaleUber: 0,
      percCash: 0.35,
      percCarta: 0.35,
      percUber: 0.35,
    });
    expect(s).toBe(35);
  });

  it("calcola stipendio completo", () => {
    const s = calcolaStipendio({
      oreLavorate: 8,
      tariffaOraria: 12,
      totaleCash: 200,
      totaleCarta: 100,
      totaleUber: 50,
      percCash: 0.35,
      percCarta: 0.35,
      percUber: 0.35,
    });
    // 8*12 + 200*0.35 + 100*0.35 + 50*0.35 = 96 + 70 + 35 + 17.5 = 218.5
    expect(s).toBeCloseTo(218.5);
  });
});

describe("calcolaSaldo", () => {
  const corse = [
    { data: "2026-05-08", tipo_pagamento: "cash",   importo: 100 },
    { data: "2026-05-08", tipo_pagamento: "carta",  importo: 85 },  // carta non entra nel saldo
    { data: "2026-05-08", tipo_pagamento: "noninc", importo: 50 },  // noninc non entra
    { data: "2026-05-10", tipo_pagamento: "cash",   importo: 120 }, // dopo la data di taglio
  ];
  const spese = [
    { data: "2026-05-07", importo: 30 },
    { data: "2026-05-09", importo: 20 }, // dopo il taglio
  ];

  it("include solo cash e spese fino alla data", () => {
    const saldo = calcolaSaldo(corse, spese, "2026-05-08");
    // cash fino all'08: 100; spese fino all'08: 30; saldo = 100 - 30 = 70
    expect(saldo).toBe(70);
  });

  it("esclude carta e noninc dal saldo", () => {
    const saldo = calcolaSaldo(corse, spese, "2026-05-11");
    // cash: 100 + 120 = 220; spese: 30 + 20 = 50; saldo = 170
    expect(saldo).toBe(170);
  });
});
