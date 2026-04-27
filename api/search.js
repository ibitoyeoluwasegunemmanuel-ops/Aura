// Edge runtime — proxies DuckDuckGo Instant Answer API server-side (avoids CORS)
export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const query = (body.query || "").trim();
  if (!query) return new Response(JSON.stringify({ results: [], abstract: "" }), { status: 200 });

  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, { headers: { "User-Agent": "AURA-OS/1.0" } });
    const data = await res.json();

    const results = [];

    if (data.AbstractText) {
      results.push({ title: data.AbstractSource || "Summary", snippet: data.AbstractText, url: data.AbstractURL || "" });
    }

    (data.RelatedTopics || []).slice(0, 6).forEach(t => {
      if (t.Text && t.FirstURL) {
        results.push({ title: t.Text.slice(0, 80), snippet: t.Text, url: t.FirstURL });
      } else if (t.Topics) {
        t.Topics.slice(0, 3).forEach(sub => {
          if (sub.Text && sub.FirstURL) results.push({ title: sub.Text.slice(0, 80), snippet: sub.Text, url: sub.FirstURL });
        });
      }
    });

    (data.Results || []).forEach(r => {
      if (r.Text && r.FirstURL) results.push({ title: r.Text.slice(0, 80), snippet: r.Text, url: r.FirstURL });
    });

    return new Response(JSON.stringify({ results: results.slice(0, 8), abstract: data.AbstractText || "", answer: data.Answer || "" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message, results: [] }), { status: 500 });
  }
}
