import { describe, it, expect } from "vitest";
import {
  validaFile,
  pulisciNomeFile,
  chiaveOggetto,
  isEntita,
  isUuid,
  formatDimensione,
  DIMENSIONE_MAX,
} from "@/lib/allegati";

describe("allegati", () => {
  it("accetta solo i formati previsti entro il limite di dimensione", () => {
    expect(validaFile("image/jpeg", 1000)).toBeNull();
    expect(validaFile("application/pdf", DIMENSIONE_MAX)).toBeNull();
    expect(validaFile("image/svg+xml", 1000)).toMatch(/Formato/);
    expect(validaFile("text/html", 1000)).toMatch(/Formato/);
    expect(validaFile("image/png", 0)).toMatch(/vuoto/);
    expect(validaFile("image/png", 1.5)).toMatch(/vuoto/);
    expect(validaFile("image/png", DIMENSIONE_MAX + 1)).toMatch(/grande/);
  });

  it("ripulisce il nome file da percorsi e caratteri di controllo", () => {
    expect(pulisciNomeFile("C:\\Users\\marco\\scontrino.jpg")).toBe("scontrino.jpg");
    expect(pulisciNomeFile("../../etc/passwd")).toBe("passwd");
    expect(pulisciNomeFile('a"b\nc.pdf')).toBe("abc.pdf");
    expect(pulisciNomeFile("")).toBe("allegato");
    expect(pulisciNomeFile("x".repeat(300))).toHaveLength(120);
  });

  it("costruisce chiavi senza il nome originale del file", () => {
    const k = chiaveOggetto("u1", "spesa", "a1", "image/jpeg");
    expect(k).toBe("allegati/u1/spesa/a1.jpg");
    expect(chiaveOggetto("u1", "corsa", "a2", "application/pdf")).toBe("allegati/u1/corsa/a2.pdf");
  });

  it("valida entità e uuid", () => {
    expect(isEntita("spesa")).toBe(true);
    expect(isEntita("autisti")).toBe(false);
    expect(isUuid("3f2504e0-4f89-11d3-9a0c-0305e82c3301")).toBe(true);
    expect(isUuid("1 OR 1=1")).toBe(false);
  });

  it("formatta le dimensioni", () => {
    expect(formatDimensione(500)).toBe("500 B");
    expect(formatDimensione(2048)).toBe("2 KB");
    expect(formatDimensione(1.5 * 1024 * 1024)).toBe("1,5 MB");
  });
});
