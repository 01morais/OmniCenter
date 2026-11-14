import "server-only";

/** Chamada única à API da OpenAI, só no servidor. Retorna null se faltar chave, demorar ou falhar:
 *  o sistema continua funcionando só com as regras. */
export async function perguntarIA<T>(sistema: string, usuario: string): Promise<T | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 4000);
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal: ctl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini", temperature: 0, response_format: { type: "json_object" },
        messages: [{ role: "system", content: sistema }, { role: "user", content: usuario }],
      }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return JSON.parse(j.choices[0].message.content) as T;
  } catch { return null; } finally { clearTimeout(t); }
}
