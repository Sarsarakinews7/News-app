// Dana AI proxy for Cloudflare Workers (free plan).
// Secret needed: GEMINI_API_KEY. Optional variables: GEMINI_MODEL, ALLOWED_ORIGIN.
const DEFAULT_ORIGIN = "https://sarsarakinews7.github.io";

const J = (o, s, h) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json; charset=utf-8", ...h } });
const safeUrl = value => {
  try { const u = new URL(String(value || "")); return u.protocol === "https:" ? u.href : ""; }
  catch { return ""; }
};

export default {
  async fetch(req, env) {
    const allowed = env.ALLOWED_ORIGIN || DEFAULT_ORIGIN;
    const cors = { "Access-Control-Allow-Origin": allowed, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" };
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (req.method !== "POST") return J({ error: "POST only" }, 405, cors);
    if ((req.headers.get("Origin") || "") !== allowed) return J({ error: "origin not allowed" }, 403, cors);
    if (!env.GEMINI_API_KEY) return J({ error: "server not configured" }, 500, cors);

    let b;
    try { b = await req.json(); } catch { return J({ error: "bad request" }, 400, cors); }
    const mode = b.mode === "full_story" ? "full_story" : "chat";
    const title = String(b.story?.title || "").slice(0, 300);
    const summary = String(b.story?.summary || "").slice(0, 3000);
    const sourceList = (Array.isArray(b.story?.sources) ? b.story.sources : []).slice(0, 8)
      .map(s => ({ name: String(s.name || "News source").slice(0, 100), url: safeUrl(s.url) }))
      .filter(s => s.url);
    const q = String(b.question || (mode === "full_story" ? "اس خبر پر مکمل، جامع اور تازہ ترین نیوز اسٹوری تیار کریں۔" : "")).trim().slice(0, 500);
    if (!q || (mode === "full_story" && !title)) return J({ error: "missing story details" }, 400, cors);
    const hist = (Array.isArray(b.history) ? b.history : []).slice(-6).map(h => ({
      role: h.role === "model" ? "model" : "user",
      parts: [{ text: String(h.text || "").slice(0, 1200) }],
    }));

    const system = mode === "full_story"
      ? "You are a senior international news editor for Newsift. Write a detailed, balanced Urdu news report in natural, clear Urdu, normally 600-900 words when reliable information supports that length. Use Google Search to research the exact story and corroborate important claims across multiple reputable, independent news outlets. Prefer primary statements and established outlets; do not treat search snippets as confirmed facts. Explain what happened, who is involved, timeline, context/background, causes where established, reactions and differing positions, latest developments, and what remains unknown or may happen next. Separate confirmed facts from analysis. Never invent details, quotes, numbers, or dates. If sources conflict, explicitly describe the disagreement and attribute each claim. Do not copy source wording; synthesize in original language. Begin with a strong headline and concise lead, then use meaningful Urdu subheadings and paragraphs. End with a short 'اہم نکات' section. Do not fabricate source links; the application will display the search-grounding sources separately."
      : "You are Dana, the news assistant inside the Newsift app. Answer in simple, clear Urdu. Use Google Search to find current, reliable information, and base your answer on what you find. If something cannot be confirmed, say so plainly. Never invent facts, quotes or numbers. When asked about a term, explain it simply. When asked about causes or background, give the main factors and say which are reported facts and which are analysis. Keep the answer under about 200 words, in short paragraphs.";

    const context = title
      ? "\nSTORY TITLE: " + title + "\nCURRENT APP SUMMARY (background only; verify independently): " + summary +
        (sourceList.length ? "\nINITIAL SOURCES: " + sourceList.map(s => s.name + " — " + s.url).join("\n") : "")
      : "";
    const model = env.GEMINI_MODEL || "gemini-flash-latest";
    let res;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system + context }] },
          contents: [...hist, { role: "user", parts: [{ text: q }] }],
          tools: [{ google_search: {} }],
          generationConfig: mode === "full_story" ? { temperature: 0.25, maxOutputTokens: 7000 } : { temperature: 0.35, maxOutputTokens: 1200 },
        }),
      });
    } catch { return J({ error: "upstream unreachable" }, 502, cors); }
    if (!res.ok) return J({ error: "upstream " + res.status }, 502, cors);

    const d = await res.json();
    const cand = d.candidates?.[0];
    const answer = (cand?.content?.parts || []).map(p => p.text || "").join("").trim();
    const seen = new Set();
    const sources = [];
    for (const c of cand?.groundingMetadata?.groundingChunks || []) {
      const uri = safeUrl(c.web?.uri);
      if (uri && !seen.has(uri)) { seen.add(uri); sources.push({ title: c.web?.title || "source", uri }); }
    }
    for (const s of sourceList) {
      if (!seen.has(s.url)) { seen.add(s.url); sources.push({ title: s.name, uri: s.url }); }
    }
    if (!answer) return J({ error: "no answer" }, 502, cors);
    return J({ answer, sources: sources.slice(0, 10) }, 200, cors);
  },
};
