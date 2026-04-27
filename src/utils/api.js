export async function callClaude(messages, system = "", maxTokens = 1024) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, system, messages }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error ${res.status}`);
  }
  const d = await res.json();
  return d.content?.[0]?.text || "";
}

export async function callClaudeStream(messages, system = "", onChunk, onThinking, useThinking = false) {
  const body = {
    model: "claude-sonnet-4-6",
    max_tokens: useThinking ? 16000 : 1024,
    system,
    messages,
    stream: true,
    ...(useThinking ? { thinking: { type: "enabled", budget_tokens: 8000 } } : {}),
  };
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let inThinking = false;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === "content_block_start") {
          inThinking = parsed.content_block?.type === "thinking";
        }
        if (parsed.type === "content_block_delta") {
          if (parsed.delta?.type === "thinking_delta" && inThinking) {
            onThinking?.(parsed.delta.thinking);
          } else if (parsed.delta?.type === "text_delta") {
            onChunk(parsed.delta.text);
          }
        }
        if (parsed.type === "content_block_stop") inThinking = false;
      } catch {}
    }
  }
}

export async function webSearch(query) {
  try {
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    return data;
  } catch {
    return { results: [], abstract: "", answer: "" };
  }
}

export const genImg = (prompt, seed = Date.now()) =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&width=1024&height=1024&nologo=true&enhance=true&seed=${seed}`;

// Claude writes a professional image prompt first, then generates at high quality
export async function genImgEnhanced(userDesc) {
  try {
    const enhanced = await callClaude(
      [{ role: "user", content: `Write a detailed AI image generation prompt for: "${userDesc}". Reply with ONLY the prompt — no explanation. Include visual style, lighting, mood, composition, and quality keywords like "photorealistic, 8K, cinematic lighting" or matching artistic style.` }],
      "You are a professional AI image prompt engineer. Write vivid, specific prompts that produce stunning images.",
      180
    );
    const prompt = enhanced.trim() || userDesc;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&width=1024&height=1024&nologo=true&enhance=false&seed=${Date.now()}`;
  } catch {
    return genImg(userDesc);
  }
}
