export const CLOUVIA_DEFAULT_API_KEY = "clv_live_wrhnkUi6OMSHOVXlwt9Z1Obs7F3k9wu5A8E7qzt7XF7";
const STORAGE_KEY = "jacs_clouvia_api_key";

export const getEffectiveApiKey = (): string => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;
  localStorage.setItem(STORAGE_KEY, CLOUVIA_DEFAULT_API_KEY);
  return CLOUVIA_DEFAULT_API_KEY;
};

const CLOUVIA_TARGET_URL = "https://router.clouvia.id/v1/chat/completions";
const PROXY_URL = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(CLOUVIA_TARGET_URL)}`;

export interface AIPromptParams {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
}

export async function callRouterAI({
  systemPrompt,
  userPrompt,
  model = "gemini-2.5-flash",
  maxTokens = 300,
}: AIPromptParams): Promise<string> {
  try {
    const response = await fetch(PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getEffectiveApiKey()}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      return `[Error API ${response.status}]`;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "Tidak ada respons.";
  } catch (err: any) {
    // Graceful fallback to mock response if CORS/Network fails
    return "[Offline/Simulasi] Jalur Cloud AI sibuk, beralih ke engine diagnosa lokal JacS.";
  }
}
