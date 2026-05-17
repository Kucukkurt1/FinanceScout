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
Kullanıcı teknik soru sorarsa genel düzeyde açıkla; API anahtarı veya gizli bilgi isteme.`;

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
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      { error: "Asistan yapılandırılmamış. Sunucuda GEMINI_API_KEY tanımlayın." },
      { status: 503 },
    );
  }

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

  for (const m of messages) {
    if (m.role !== "user" && m.role !== "assistant") {
      return NextResponse.json({ error: "Geçersiz mesaj rolü." }, { status: 400 });
    }
    if (typeof m.content !== "string" || !m.content.trim()) {
      return NextResponse.json({ error: "Boş mesaj." }, { status: 400 });
    }
  }

  const trimmed = trimHistory(messages);
  let start = 0;
  while (start < trimmed.length && trimmed[start].role === "assistant") {
    start += 1;
  }
  const forModel = trimmed.slice(start);
  if (forModel.length === 0 || forModel[forModel.length - 1].role !== "user") {
    return NextResponse.json({ error: "Son mesaj kullanıcıdan olmalı." }, { status: 400 });
  }

  const contents = forModel.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content.slice(0, 4000) }],
  }));

  const payload = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents,
    generationConfig: {
      temperature: 0.65,
      maxOutputTokens: 1024,
    },
  };

  let lastFail: { status: number; message: string } | null = null;

  for (const model of modelCandidates()) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const raw = await upstream.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      lastFail = { status: 502, message: "Model yanıtı okunamadı." };
      continue;
    }

    const errMsg = String((data as { error?: { message?: string } }).error?.message || "");
    const errLower = errMsg.toLowerCase();

    if (!upstream.ok) {
      lastFail = { status: upstream.status, message: errMsg || `Model hatası (${upstream.status}).` };

      const quotaHit =
        upstream.status === 429 ||
        errLower.includes("quota") ||
        errLower.includes("resource exhausted") ||
        errLower.includes("rate limit");

      if (quotaHit) {
        return NextResponse.json(
          {
            error:
              "Gemini kotası veya plan limiti: bir süre bekleyin, AI Studio’da kullanımı kontrol edin veya faturalandırmayı açın. İsterseniz .env.local içinde başka bir GEMINI_MODEL deneyin (ör. gemini-2.5-flash).",
          },
          { status: upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502 },
        );
      }

      if (upstream.status === 403) {
        return NextResponse.json({ error: errMsg || "API anahtarı geçersiz veya erişim reddedildi." }, { status: 403 });
      }

      if (isWrongModelError(upstream.status, errMsg)) {
        continue;
      }

      return NextResponse.json(
        { error: lastFail.message },
        { status: upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502 },
      );
    }

    const gemCandidates = (data as { candidates?: unknown[] }).candidates;
    const first = Array.isArray(gemCandidates) ? gemCandidates[0] : undefined;
    const parts = (first as { content?: { parts?: { text?: string }[] } } | undefined)?.content?.parts;
    const text =
      Array.isArray(parts) && parts[0]?.text
        ? String(parts[0].text)
        : "";

    if (!text) {
      const reason = (first as { finishReason?: string } | undefined)?.finishReason;
      return NextResponse.json(
        { error: reason ? `Yanıt üretilemedi (${reason}).` : "Yanıt üretilemedi." },
        { status: 502 },
      );
    }

    return NextResponse.json({ reply: text, model_used: model });
  }

  return NextResponse.json(
    {
      error:
        lastFail?.message ||
        "Hiçbir model adı bu API anahtarı ile kullanılamadı. Google AI Studio’da geçerli model listesine bakın ve GEMINI_MODEL değerini güncelleyin.",
    },
    { status: 502 },
  );
}
