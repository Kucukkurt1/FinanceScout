import { NextResponse } from "next/server";

/** Kısa adlar (ör. gemini-1.5-flash) API’de kalkmış olabiliyor; tam/sürüm adları ve zincir kullanılıyor. */
const DEFAULT_MODEL = "gemini-2.5-flash";

const MODEL_TRY_ORDER = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-1.5-flash-002",
  "gemini-3-flash-preview",
] as const;

const MAX_USER_CHARS = 8000;
const MAX_TURNS = 24;

const SYSTEM = `Sen FinanceScout sitesinin yardımcı asistanısın. Türkçe yanıt ver; kısa ve net ol.
Site: finansal veri özeti, Prophet tabanlı tahmin/grafik arayüzü ve bilgilendirici içerikler sunar.
Yatırım tavsiyesi verme; "bilgilendirme amaçlıdır" uyarısını gerektiğinde hatırlat.

KULLANICI TAHMİN/KUR SORARSA:
- 'get_forecast' aracını kullanarak güncel veriyi ve tahmini al.
- Gelen veriye göre (RMSE, MAE vb.) modelin güvenilirliğini ve yönü (artış/azalış) yorumla.
- Yanıtında mutlaka "Analiz sonucuna göre..." diyerek başla.
- Eğer sembolü tam çıkaramazsan en yakın tahmini (örn. "dolar" için "USDTRY=X") kullan.`;

const TOOLS = [
  {
    function_declarations: [
      {
        name: "get_forecast",
        description: "Belirtilen finansal sembol (ticker) için geçmiş verileri ve gelecek tahminlerini getirir. Örn: 'USDTRY=X', 'BTC-USD', 'GC=F', 'THYAO.IS'.",
        parameters: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              description: "Tahmin edilecek finansal sembol (örn: USDTRY=X).",
            },
          },
          required: ["symbol"],
        },
      },
    ],
  },
];

async function callBackendForecast(symbol: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${baseUrl}/forecast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol,
        history_days: 365,
        forecast_days: 14,
      }),
    });
    if (!res.ok) return { error: `Backend hatası: ${res.status}` };
    return await res.json();
  } catch (err) {
    return { error: "Backend'e ulaşılamadı." };
  }
}

const SYMBOL_ALIASES: Array<[RegExp, string]> = [
  [/\b(usdtry|usd\/try|dolar|dollar|amerikan doları|abd doları)\b/i, "USDTRY=X"],
  [/\b(eurtry|eur\/try|euro|avro)\b/i, "EURTRY=X"],
  [/\b(gbptry|gbp\/try|sterlin|pound)\b/i, "GBPTRY=X"],
  [/\b(bitcoin|btc)\b/i, "BTC-USD"],
  [/\b(ethereum|ether|eth)\b/i, "ETH-USD"],
  [/(altın|altin|altının|altinin|gold|xau|ons)/i, "GC=F"],
  [/(gümüş|gumus|gümüşün|gumusun|silver)/i, "SI=F"],
  [/\b(petrol|oil|brent)\b/i, "BZ=F"],
  [/\b(thy|thy hisseleri|thy hisse|thy ao|thyao)\b/i, "THYAO.IS"],
];

function directForecastSymbol(text: string): string | null {
  const normalized = text.toLocaleLowerCase("tr-TR");

  const explicitTicker = text.match(/\b[A-Z0-9]{2,8}(?:[-.=][A-Z0-9]{1,5})?(?:\.IS)?\b/);
  if (explicitTicker?.[0] && /[-.=]|TRY|USD|BTC|ETH|XAU|XAG/.test(explicitTicker[0])) {
    const ticker = explicitTicker[0].toUpperCase();
    if (ticker === "USDTRY") return "USDTRY=X";
    if (ticker === "EURTRY") return "EURTRY=X";
    if (ticker === "GBPTRY") return "GBPTRY=X";
    return ticker;
  }

  const asksForecast =
    /\b(ne olur|tahmin|forecast|kur|fiyat|analiz|grafik|yüksel|yuksel|düşer|duser|çıkar|cikar|artar|artış|artista|artışta|hisse|kaç|kac|durum|genel)\b/i.test(normalized);
  if (!asksForecast) return null;

  for (const [pattern, symbol] of SYMBOL_ALIASES) {
    if (pattern.test(normalized)) return symbol;
  }

  return null;
}

function finiteNumber(n: unknown): number | null {
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function fmtNum(n: number | null, digits = 2): string {
  if (n === null) return "veri yok";
  return n.toLocaleString("tr-TR", { maximumFractionDigits: digits });
}

function fmtPct(n: number | null): string {
  if (n === null) return "veri yok";
  return `%${(n * 100).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
}

function forecastReply(symbol: string, forecastData: any): string {
  if (forecastData?.error) {
    return `Analiz sonucuna göre ${symbol} için veri alınamadı: ${forecastData.error}`;
  }

  const history = Array.isArray(forecastData?.history) ? forecastData.history : [];
  const forecast = Array.isArray(forecastData?.forecast) ? forecastData.forecast : [];
  const lastHistory = [...history].reverse().find((p) => finiteNumber(p?.y) !== null);
  const lastForecast = [...forecast].reverse().find((p) => finiteNumber(p?.yhat) !== null);
  const current = finiteNumber(lastHistory?.y);
  const target = finiteNumber(lastForecast?.yhat);
  const change = current !== null && target !== null && current !== 0 ? (target - current) / current : null;
  const direction = change === null ? "yön net hesaplanamadı" : change >= 0 ? "yukarı yönlü" : "aşağı yönlü";
  const metrics = forecastData?.backtest_metrics ?? {};
  const mape = finiteNumber(metrics.mape);
  const rmse = finiteNumber(metrics.rmse);
  const mae = finiteNumber(metrics.mae);

  return [
    `Analiz sonucuna göre ${symbol} için ${forecast.length || 14} günlük görünüm ${direction}.`,
    `Son kapanış yaklaşık ${fmtNum(current)}, dönem sonu tahmin yaklaşık ${fmtNum(target)}${change === null ? "" : ` (${fmtPct(change)})`}.`,
    `Model hata göstergeleri: MAPE ${fmtPct(mape)}, RMSE ${fmtNum(rmse, 4)}, MAE ${fmtNum(mae, 4)}.`,
    "Aşağıdaki grafikte geçmiş fiyatlar, tahmin çizgisi ve güven aralığı yer alır. Bu çıktı bilgilendirme amaçlıdır, yatırım tavsiyesi değildir.",
  ].join("\n\n");
}

type ChatMsg = { role: "user" | "assistant"; content: string };

function trimHistory(msgs: ChatMsg[]): ChatMsg[] {
  const slice = msgs.slice(-MAX_TURNS);
  let total = 0;
  const out: ChatMsg[] = [];
  for (let i = slice.length - 1; i >= 0; i--) {
    const m = slice[i];
    const len = (m.content || "").length;
    if (total + len > MAX_USER_CHARS) break;
    total += len;
    out.push(m);
  }
  return out.reverse();
}

function modelCandidates(): string[] {
  const user = process.env.GEMINI_MODEL?.trim();
  const primary = user || DEFAULT_MODEL;
  const ordered = [primary, ...MODEL_TRY_ORDER.filter((m) => m !== primary)];
  return [...new Set(ordered)];
}

function isWrongModelError(status: number, message: string): boolean {
  const m = message.toLowerCase();
  if (status === 404) return true;
  return (
    m.includes("is not found for api version") ||
    m.includes("not supported for generatecontent") ||
    m.includes("call modelservice.listmodels")
  );
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const messages = (body as { messages?: ChatMsg[] }).messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Mesaj listesi gerekli." }, { status: 400 });
  }

  const lastUser = [...messages].reverse().find((m) => m?.role === "user" && typeof m.content === "string");
  const directSymbol = lastUser ? directForecastSymbol(lastUser.content) : null;
  if (directSymbol) {
    const forecastData = await callBackendForecast(directSymbol);
    return NextResponse.json({
      reply: forecastReply(directSymbol, forecastData),
      forecastData: forecastData.error ? null : forecastData,
      model_used: "backend-forecast",
    });
  }

  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      { error: "Asistan yapılandırılmamış. Sunucuda GEMINI_API_KEY tanımlayın." },
      { status: 503 },
    );
  }

  const trimmed = trimHistory(messages);
  let start = 0;
  while (start < trimmed.length && trimmed[start].role === "assistant") {
    start += 1;
  }
  const forModel = trimmed.slice(start);

  const contents = forModel.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content.slice(0, 4000) }],
  }));

  const payload: any = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents,
    tools: TOOLS,
    generationConfig: {
      temperature: 0.65,
      maxOutputTokens: 1024,
    },
  };

  let lastFail: { status: number; message: string } | null = null;

  for (const model of modelCandidates()) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

    let response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let data = await response.json();

    if (!response.ok) {
      lastFail = { status: response.status, message: data.error?.message || "Model hatası." };
      if (isWrongModelError(response.status, lastFail.message)) continue;
      return NextResponse.json({ error: lastFail.message }, { status: response.status });
    }

    let candidate = data.candidates?.[0];
    let part = candidate?.content?.parts?.[0];

    // Eğer model bir fonksiyon çağırmak istiyorsa
    if (part?.functionCall) {
      const { name, args } = part.functionCall;
      if (name === "get_forecast") {
        const forecastData = await callBackendForecast(args.symbol);

        // Aracı çalıştırdıktan sonra sonucu tekrar modele gönder
        const toolResponsePayload = {
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [
            ...contents,
            { role: "model", parts: [part] },
            {
              role: "function",
              parts: [
                {
                  functionResponse: {
                    name: "get_forecast",
                    response: { content: forecastData },
                  },
                },
              ],
            },
          ],
          generationConfig: payload.generationConfig,
        };

        const secondResponse = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toolResponsePayload),
        });

        const secondData = await secondResponse.json();
        const finalCandidate = secondData.candidates?.[0];
        const finalText = finalCandidate?.content?.parts?.[0]?.text || forecastReply(args.symbol, forecastData);

        return NextResponse.json({
          reply: finalText,
          forecastData: forecastData.error ? null : forecastData,
          model_used: model,
        });
      }
    }

    const text = part?.text || "";
    if (!text) continue;

    return NextResponse.json({ reply: text, model_used: model });
  }

  return NextResponse.json({ error: "Yanıt üretilemedi." }, { status: 502 });
}
