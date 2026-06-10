import { GoogleGenerativeAI } from "@google/generative-ai";

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  if (!key) throw new Error("AI service not configured. Please contact support.");
  return key;
}

function getModel(modelName = "gemini-2.5-flash", jsonMode = false) {
  const genAI = new GoogleGenerativeAI(getApiKey());
  return genAI.getGenerativeModel({
    model: modelName,
    ...(jsonMode ? { generationConfig: { responseMimeType: "application/json" } } : {}),
  });
}

function classifyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("API_KEY") || msg.includes("API key") || msg.includes("not configured")) {
    return "AI service not configured. Please contact support.";
  }
  if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
    return "AI service is temporarily busy. Please try again in a moment.";
  }
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("ECONNREFUSED")) {
    return "Connection error. Please check your internet and try again.";
  }
  return msg || "Generation failed. Please try again.";
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
      if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 2000));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function generateJSON<T>(prompt: string, maxRetries = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const model = getModel("gemini-2.5-flash", true);
      const fullPrompt = `${prompt}\n\nReturn valid JSON only. No markdown, no code fences.`;
      const result = await model.generateContent(fullPrompt);
      const raw = result.response.text().trim();
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      try {
        return JSON.parse(cleaned) as T;
      } catch {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]) as T;
        throw new Error("Failed to parse AI response as JSON");
      }
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 2000));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export { classifyError };
