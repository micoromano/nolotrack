export async function sendPush(params: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}) {
  try {
    await fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch {
    // notifica non critica, ignora errori di rete
  }
}
