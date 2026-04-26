import { GoogleGenAI } from "@google/genai";

export const MODEL_NAME = "gemini-2.5-flash-lite";

export function getGeminiErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Failed to generate diet plan.";
  }

  const anyError = error as Error & {
    status?: number;
    cause?: unknown;
  };
  const rawMessage = error.message || "";

  if (
    rawMessage.includes("API_KEY_INVALID") ||
    rawMessage.includes("API Key not found") ||
    rawMessage.includes("Please pass a valid API key")
  ) {
    return "Gemini API key is invalid or revoked. Update GEMINI_API_KEY in .env.local and restart the server.";
  }

  if (rawMessage.includes("PERMISSION_DENIED")) {
    return "Gemini API access was denied. Check that the key is from Google AI Studio and the Generative Language API is enabled.";
  }

  if (anyError.status === 429 || rawMessage.includes("RESOURCE_EXHAUSTED")) {
    return "Gemini rate limit reached. Try again shortly or use a different API key/project.";
  }

  if (process.env.NODE_ENV !== "production" && rawMessage) {
    return `Failed to generate diet plan. Raw Gemini error: ${rawMessage}`;
  }

  return rawMessage || "Failed to generate diet plan.";
}

export function getGeminiClient(): GoogleGenAI {
  // Explicitly check for preferred keys, prioritizing our app-specific key
  // to bypass any old system-wide GEMINI_API_KEY that might be stuck
  const soulrepKey = process.env.SOULREP_GEMINI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const googleKey = process.env.GOOGLE_API_KEY;

  // Log which variables are detected
  if (process.env.NODE_ENV !== "production") {
    console.log(`[gemini] Found SOULREP_GEMINI_API_KEY: ${soulrepKey ? "Yes" : "No"}, GEMINI_API_KEY: ${geminiKey ? "Yes" : "No"}`);
  }

  // Use the specific key if provided, fallback to standard keys
  const rawKey = soulrepKey || geminiKey || googleKey;

  const apiKey = rawKey?.trim().replace(/['"]/g, '');

  if (!apiKey) {
    throw new Error("Gemini API key is missing. Set GEMINI_API_KEY or GOOGLE_API_KEY in .env.local.");
  }

  if (process.env.NODE_ENV !== "production") {
    const visiblePrefix = apiKey.slice(0, 6);
    const visibleSuffix = apiKey.slice(-4);
    // Explicitly check if the key looks like a Gemini key (starts with AIzaSy)
    const isValidPrefix = apiKey.startsWith("AIzaSy");
    console.log(`[gemini] Final Key Check: ${visiblePrefix}...${visibleSuffix} (len=${apiKey.length}, validPrefix=${isValidPrefix})`);
  }

  // Use the specific API Studio client for simple API keys
  // Note: For @google/genai, this is the correct constructor.
  return new GoogleGenAI({ apiKey });
}
