import { NextResponse } from "next/server";

import { buildApiUrl } from "@/lib/api-base";

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
Yatırım tavsiyesi verme; "bilgilendirme amaçlıdır" uyarısını mutlaka ekle.

KULLANICI TAHMİN/KUR SORARSA:
- 'get_forecast' aracını kullanarak güncel veriyi ve tahmini al.
- Yanıtında mutlaka "Analiz sonucuna göre..." diyerek başla.
- Sistemin beklentisi olan hedef fiyatı, olası en düşük (min) ve en yüksek (max) seviyeleri (yhat, yhat_lower, yhat_upper) mutlaka rakamlarla belirt.
- Örn: "Sistemimizin beklentisi olan hedef fiyat X, olası en düşük seviye Y ve en yüksek seviye Z'dir."
- Gelen veriye göre (RMSE, MAE vb.) modelin güvenilirliğini ve yönü (artış/azalış) yorumla.
- Eğer sembolü tam çıkaramazsan en yakın tahmini (örn. "dolar" için "USDTRY=X") kullan.`;

const TOOLS = [
  {
    function_declarations: [
      {
        name: "get_forecast",
        description: "Belirtilen finansal sembol (ticker) için geçmiş verileri ve gelecek tahminlerini getirir. Yanıt olarak yhat (tahmin), yhat_lower (min beklenti) ve yhat_upper (max beklenti) değerlerini içeren bir liste döner.",
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

async function callBackendForecast(symbol: string, forecastDays = 14) {
  try {
    const res = await fetch(buildApiUrl("/forecast"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol,
        history_days: 365,
        forecast_days: forecastDays,
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

function directForecastDays(text: string): number {
  const normalized = text.toLocaleLowerCase("tr-TR");
  if (/\b(yarın|yarin)\b/i.test(normalized)) return 1;
  if (/\b(haftaya|1 hafta|bir hafta|hafta sonra|gelecek hafta)\b/i.test(normalized)) return 7;
  if (/\b(1 ay|bir ay|ay sonra|gelecek ay)\b/i.test(normalized)) return 30;
  return 14;
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

function priceUnit(symbol: string): string {
  if (symbol.includes("TRY")) return "TL";
  if (symbol === "GC=F" || symbol === "SI=F") return "USD/ons";
  if (symbol.includes("-USD") || symbol.includes("=F") || ["AAPL", "MSFT", "NVDA", "TSLA", "META", "GOOGL", "AMZN"].includes(symbol)) {
    return "USD";
  }
  return "";
}

function fmtPrice(n: number | null, symbol: string): string {
  const unit = priceUnit(symbol);
  const value = fmtNum(n, symbol.includes("TRY") ? 4 : 2);
  return unit && value !== "veri yok" ? `${value} ${unit}` : value;
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
  const minExpected = finiteNumber(lastForecast?.yhat_lower);
  const maxExpected = finiteNumber(lastForecast?.yhat_upper);
  
  const change = current !== null && target !== null && current !== 0 ? (target - current) / current : null;
  const direction = change === null ? "yön net hesaplanamadı" : change >= 0 ? "yukarı yönlü" : "aşağı yönlü";
  
  const metrics = forecastData?.backtest_metrics ?? {};
  const mape = finiteNumber(metrics.mape);
  const rmse = finiteNumber(metrics.rmse);
  const mae = finiteNumber(metrics.mae);

  return [
    `Analiz sonucuna göre ${symbol} için ${forecast.length || 14} günlük görünüm ${direction}.`,
    `Son kapanış fiyatı ${fmtPrice(current, symbol)}.`,
    `Sistemimize göre dönem sonunda beklenen hedef fiyat ${fmtPrice(target, symbol)} olabilir. Olası en düşük senaryo ${fmtPrice(minExpected, symbol)}, olası en yüksek senaryo ise ${fmtPrice(maxExpected, symbol)} olarak hesaplanmıştır${change === null ? "" : ` (${fmtPct(change)} değişim beklentisi)`}.`,
    `Model hata göstergeleri: MAPE ${fmtPct(mape)}, RMSE ${fmtNum(rmse, 4)}, MAE ${fmtNum(mae, 4)}.`,
    "Aşağıdaki grafikte geçmiş fiyatlar, tahmin çizgisi ve min/max güven aralığı yer alır. Bu çıktı yalnızca bilgilendirme amaçlıdır; yatırım tavsiyesi değildir.",
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
    const forecastData = await callBackendForecast(directSymbol, directForecastDays(lastUser?.content ?? ""));
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
