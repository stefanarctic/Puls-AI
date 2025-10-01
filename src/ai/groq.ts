// Minimal Groq API client (OpenAI-compatible Chat Completions API)

export type GroqChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }
  >;
};

export interface GroqChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

const DEFAULT_MODEL = process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';

export async function groqChat(
  messages: GroqChatMessage[],
  options?: GroqChatOptions
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set');
  }

  const model = options?.model ?? DEFAULT_MODEL;

  // Determine if the target model is multimodal (supports image parts)
  // Treat Llama 4 Scout as vision-capable as it supports images with Groq's API.
  const isVisionModel = /(vision|vl|llava|multimodal|scout)/i.test(model);

  const isDataUri = (url: string) => /^data:/i.test(url);
  const truncate = (text: string, max = 4000) => (text.length > max ? text.slice(0, max) + '…' : text);

  // For vision-capable models, preserve image parts and only truncate long text parts.
  const messagesForVision = messages.map(m => ({
    role: m.role,
    content: m.content.map(part => (part.type === 'text' ? { type: 'text', text: truncate(part.text) } : part)),
  }));

  // For text-only models, convert any images into helpful textual hints and
  // flatten content into a single string per message as required by the
  // OpenAI-compatible Chat Completions API for non-multimodal models.
  const messagesForTextOnly = messages.map(m => ({
    role: m.role,
    content: m.content
      .map(part => {
        if (part.type === 'image_url') {
          const hint = isDataUri(part.image_url.url)
            ? 'Imagine atașată (omisa pentru model text-only)'
            : `Imagine atașată: ${part.image_url.url}`;
          return hint;
        }
        return truncate(part.text);
      })
      .filter(Boolean)
      .join('\n')
      .slice(0, 8000),
  }));

  const payloadMessages = isVisionModel ? (messagesForVision as any) : (messagesForTextOnly as any);

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.max_tokens ?? 2048,
      messages: payloadMessages as any,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq API returned no content');
  return content;
}


