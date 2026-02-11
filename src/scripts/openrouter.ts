import { state } from "./state";
import { t } from "./i18n/index";
import { showErrorModal } from "./modules/errors/handler";

interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content:
    | string
    | Array<{ type: string; text?: string; image_url?: { url: string } }>;
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

// OpenRouter supported aspect ratios and their resolutions
// https://openrouter.ai/docs/guides/overview/multimodal/image-generation
const ASPECT_RATIO_MAP: Record<string, string> = {
  "16:9": "16:9",
  "9:16": "9:16",
  "1:1": "1:1",
  "4:3": "4:3",
  match_input_image: "16:9", // Fallback — OpenRouter doesn't support match_input_image
};

// Resolution mapping from UI values to OpenRouter image_size values
const RESOLUTION_MAP: Record<string, "1K" | "2K" | "4K"> = {
  "144p": "1K",
  "240p": "1K",
  "360p": "1K",
  "480p": "1K",
  "720p": "1K",
  "1080p": "2K",
  "1440p": "2K",
  "2160p": "4K",
};

export async function generateViaOpenRouter(params: {
  prompt: string;
  aspectRatio: string;
  resolution: string;
  referenceImages: string[];
}): Promise<string> {
  const { prompt, aspectRatio, resolution, referenceImages } = params;

  // Build messages array
  const messages: OpenRouterMessage[] = [];

  // System message with instructions
  messages.push({
    role: "system",
    content:
      "You are an image generation assistant. Generate high-quality YouTube thumbnails based on the user's prompt.",
  });

  // Build user content - use structured content array for proper image handling
  const userContent: Array<{
    type: string;
    text?: string;
    image_url?: { url: string };
  }> = [];

  // Add the text prompt first
  userContent.push({
    type: "text",
    text: prompt,
  });

  // Add reference images as image_url content parts
  for (const img of referenceImages) {
    // img is a data URI like "data:image/png;base64,..."
    userContent.push({
      type: "image_url",
      image_url: {
        url: img,
      },
    });
  }

  messages.push({
    role: "user",
    content: userContent,
  });

  const mappedRatio = ASPECT_RATIO_MAP[aspectRatio] || "16:9";
  const mappedSize = RESOLUTION_MAP[resolution] || "1K";

  const body = {
    model: "google/gemini-3-pro-image-preview",
    messages,
    modalities: ["image"],
    image_config: {
      aspect_ratio: mappedRatio,
      image_size: mappedSize,
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
