// Edge runtime — receives base64-encoded PDF, extracts text using pdf.js via CDN-compatible approach
// Since edge runtime can't use native Node modules, we use Anthropic's built-in PDF support via the Claude API
export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), { status: 500 });
  }

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const { base64, mediaType = "application/pdf", question = "Summarize this document. List the key points." } = body;
  if (!base64) return new Response(JSON.stringify({ error: "No PDF data provided" }), { status: 400 });

  // Use Claude's native PDF support (claude-sonnet-4-6 supports document blocks)
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "pdfs-2024-09-25",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: question },
        ],
      }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return new Response(JSON.stringify({ error: err?.error?.message || "Claude API error" }), { status: res.status });
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || "";
  return new Response(JSON.stringify({ text }), { headers: { "Content-Type": "application/json" } });
}
