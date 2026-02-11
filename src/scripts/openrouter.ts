import { state } from "./state";
import { t } from "./i18n/index";
import { showErrorModal } from "./modules/errors/handler";

interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface OpenRouterImage {
  index: number;
  type: string;
  image_url: {
    url: string;
  };
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
      images?: OpenRouterImage[];
    };
  }>;
  error?: { message: string; code: string };
}

const ASPECT_RATIO_MAP: Record<string, string> = {
  "16:9": "16:9",
  "9:16": "9:16",
  "1:1": "1:1",
  "4:3": "4:3",
  match_input_image: "16:9", // Fallback — OpenRouter doesn't support match_input_image
};

export async function generateViaOpenRouter(params: {
  prompt: string;
  aspectRatio: string;
  referenceImages: string[];
}): Promise<string> {
  const { prompt, aspectRatio, referenceImages } = params;

  // Build messages array
  const messages: OpenRouterMessage[] = [];

  // System message with instructions
  messages.push({
    role: "system",
    content:
      "You are an image generation assistant. Generate high-quality YouTube thumbnails based on the user's prompt.",
  });

  // Build user content with text and images
  let userContent = prompt;

  // Add aspect ratio instruction
  const mappedRatio = ASPECT_RATIO_MAP[aspectRatio] || "16:9";
  userContent += `\n\nGenerate the image in ${mappedRatio} aspect ratio.`;

  // Add reference images as data URIs
  for (const img of referenceImages) {
    // img is a data URI like "data:image/png;base64,..."
    userContent += `\n\nReference image: ${img}`;
  }

  messages.push({
    role: "user",
    content: userContent,
  });

  const body = {
    model: "black-forest-labs/flux.2-klein-4b",
    messages,
    response_format: {
      type: "image",
    },
  };

  // Call OpenRouter API directly (supports CORS)
  const openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";

  const response = await fetch(openRouterUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.apiKey}`,
      "HTTP-Referer":
        typeof window !== "undefined"
          ? window.location.origin
          : "https://nanothumbnail.com",
      "X-Title": "NanoThumbnail",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorDetails: Record<string, unknown>;
    try {
      errorDetails = JSON.parse(errorText);
    } catch {
      errorDetails = { rawResponse: errorText };
    }
    showErrorModal({ statusCode: response.status, errorDetails });
    throw new Error(
      `${t("alerts.error_api")} (${response.status}): ${errorText}`,
    );
  }

  const data: OpenRouterResponse = await response.json();

  if (data.error) {
    showErrorModal({
      statusCode: 500,
      errorDetails: data.error as unknown as Record<string, unknown>,
    });
    throw new Error(`${t("alerts.error_api")}: ${data.error.message}`);
  }

  // Extract image data from the response
  const message = data.choices?.[0]?.message;

  // Check for images array first (OpenRouter format)
  if (message?.images && message.images.length > 0) {
    const imageUrl = message.images[0]?.image_url?.url;
    if (imageUrl) {
      return imageUrl;
    }
  }

  // Fall back to content field
  const content = message?.content;

  if (content) {
    // Check if content is already a data URI
    if (content.startsWith("data:")) {
      return content;
    }

    // Try to extract base64 data from markdown image format: ![alt](data:image/...;base64,...)
    const markdownMatch = content.match(/!\[.*?\]\((data:image\/[^)]+)\)/);
    if (markdownMatch) {
      return markdownMatch[1];
    }

    // If content looks like base64, wrap it
    if (/^[A-Za-z0-9+/=]+$/.test(content)) {
      return `data:image/png;base64,${content}`;
    }
  }

  showErrorModal({
    statusCode: 500,
    errorDetails: {
      message: "No image returned by OpenRouter",
      response: data as unknown as Record<string, unknown>,
    },
  });
  throw new Error(t("alerts.error_generation"));
}
