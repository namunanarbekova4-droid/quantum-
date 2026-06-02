import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  "";

function getModel() {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
}

export async function generateWithRetry(
  prompt: string,
  maxRetries = 3
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const model = getModel();
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (!text) throw new Error("Empty response from Gemini");
      return text;
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      // Rate limit or quota — wait before retry
      if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 2000));
        continue;
      }
      // Non-retriable error
      throw err;
    }
  }
  throw lastError;
}

export async function generateJSON<T>(prompt: string, maxRetries = 3): Promise<T> {
  const fullPrompt = `${prompt}\n\nRespond with valid JSON only. No markdown, no code fences, no explanation. Just the JSON object.`;
  const raw = await generateWithRetry(fullPrompt, maxRetries);
  // Strip any accidental markdown fences
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try extracting JSON from the response
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error("Failed to parse AI response as JSON");
  }
}
