// Dati pubblici mostrati sul sito vetrina. I campi opzionali vengono
// nascosti automaticamente finché non viene impostata la relativa env var.
export const siteConfig = {
  nome: "Nolotrack",
  titolare: "Marco Camelin",
  tagline: "Servizio di Noleggio Con Conducente a Roma",
  citta: process.env.NEXT_PUBLIC_CONTACT_CITY || "Roma e provincia",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "marco.camelin@gmail.com",
  telefono: process.env.NEXT_PUBLIC_CONTACT_PHONE || "",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY_NUMBER || "",
  licenzaNcc: process.env.NEXT_PUBLIC_NCC_LICENSE || "",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};

export function telHref(numero: string) {
  return `tel:${numero.replace(/[^+\d]/g, "")}`;
}

export function waHref(numero: string) {
  return `https://wa.me/${numero.replace(/[^\d]/g, "")}`;
}
