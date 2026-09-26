import { generateJSON, type TextRequest } from './providers';
import { prepareReference } from './images';
import type { Score, ScoreCriterion } from './types';

type Auth = Pick<TextRequest, 'provider' | 'apiKey' | 'signal'>;
type Lang = 'en' | 'fr';

const LANG_NAME: Record<Lang, string> = { en: 'English', fr: 'French' };

/** Thumbnails are judged at the size they're actually seen, so no need for full resolution. */
const toVisionInput = (blob: Blob) => prepareReference(blob, 1024, 200_000);

const CRITERIA: ScoreCriterion['key'][] = ['legibility', 'contrast', 'focal', 'emotion', 'curiosity', 'mobile'];

const CRITIC_SYSTEM = `You are a senior YouTube packaging strategist who has reviewed thousands of thumbnails.
You judge thumbnails the way viewers meet them: a split second, at small size, among many others in a feed.
Be specific and actionable. Refer to concrete elements in the image. Never be generic or flattering.`;

export async function scoreThumbnail(
  auth: Auth,
  image: Blob,
  context: { videoTitle?: string; lang: Lang },
): Promise<Score> {
  const prompt = `Critique this YouTube thumbnail${context.videoTitle ? ` for a video titled "${context.videoTitle}"` : ''}.

Score each criterion from 0 to 10:
- legibility: is any text readable at 168×94 px? (no text at all is fine if the image reads instantly)
- contrast: subject/background separation, colour punch, does it stand out in a feed
- focal: one clear focal point, uncluttered
- emotion: clear, strong emotion or intrigue (faces, body language, stakes)
- curiosity: does it create a curiosity gap that complements${context.videoTitle ? ' (not repeats) the title' : ' the likely title'}
- mobile: still works at phone-feed size; nothing important in the bottom-right corner (duration badge)

Return JSON only:
{
  "overall": <0-100>,
  "criteria": [{"key": "<one of ${CRITERIA.join('|')}>", "score": <0-10>, "comment": "<one sentence>"}],
  "strengths": ["<max 3 short bullets>"],
  "improvements": ["<max 3 short bullets>"],
  "suggestedEdits": ["<max 3 imperative edit instructions an image-editing model can execute directly, e.g. 'Make the text twice as large and move it to the top-left'>"]
}
Write every comment, bullet and edit instruction in ${LANG_NAME[context.lang]}.`;

  const raw = await generateJSON<Omit<Score, 'createdAt'>>({
    ...auth,
    system: CRITIC_SYSTEM,
    prompt,
    images: [await toVisionInput(image)],
  });

  return {
    overall: clamp(Number(raw.overall) || 0, 0, 100),
    criteria: CRITERIA.map((key) => {
      const c = raw.criteria?.find((x) => x.key === key);
      return { key, score: clamp(Number(c?.score) || 0, 0, 10), comment: c?.comment ?? '' };
    }),
    strengths: (raw.strengths ?? []).slice(0, 3),
    improvements: (raw.improvements ?? []).slice(0, 3),
    suggestedEdits: (raw.suggestedEdits ?? []).slice(0, 3),
    createdAt: Date.now(),
  };
}

export interface Ranking {
  /** Indices into the submitted images, best first. */
  order: number[];
  reasons: string[];
  winnerWhy: string;
}

export async function rankThumbnails(
  auth: Auth,
  images: Blob[],
  context: { videoTitle?: string; lang: Lang },
): Promise<Ranking> {
  const prompt = `These ${images.length} images are alternative thumbnails for the same video${context.videoTitle ? ` titled "${context.videoTitle}"` : ''}, numbered 1 to ${images.length} in order.
Rank them by how likely a viewer scrolling a YouTube feed on a phone is to click, while still matching the title.
Return JSON only:
{"order": [<image numbers, best first>], "reasons": ["<one sentence per image, in the original order 1..${images.length}>"], "winnerWhy": "<two sentences on why the winner wins>"}
Write in ${LANG_NAME[context.lang]}.`;

  const raw = await generateJSON<Ranking>({
    ...auth,
    system: CRITIC_SYSTEM,
    prompt,
    images: await Promise.all(images.map(toVisionInput)),
  });
  const order = (raw.order ?? []).map((n) => Number(n) - 1).filter((i) => i >= 0 && i < images.length);
  for (let i = 0; i < images.length; i++) if (!order.includes(i)) order.push(i);
  return { order, reasons: raw.reasons ?? [], winnerWhy: raw.winnerWhy ?? '' };
}

export interface Concept {
  name: string;
  brief: string;
  overlayText: string;
  why: string;
  styleId?: string;
}

export async function suggestConcepts(
  auth: Auth,
  input: { videoTitle: string; idea: string; lang: Lang; styles: Array<{ id: string; name: string }> },
): Promise<Concept[]> {
  const prompt = `Video title: "${input.videoTitle || '(none yet)'}"
Creator's rough idea: "${input.idea || '(none)'}"

Propose 3 thumbnail concepts that take genuinely different angles (e.g. emotional reaction vs. result/transformation vs. mystery/object). For each:
- name: 2-4 words
- brief: a vivid scene description for an image model (subject, action, emotion, composition, background, lighting), 2-3 sentences, written in ${LANG_NAME[input.lang]}
- overlayText: 0-4 words to display on the thumbnail, in ${LANG_NAME[input.lang]}, complementing the title without repeating it; empty string if the image should speak alone
- why: one sentence in ${LANG_NAME[input.lang]} on why it would get clicks
- styleId: the best matching id from this list, or "" : ${input.styles.map((s) => `${s.id} (${s.name})`).join(', ')}

Return JSON only: {"concepts": [{"name": "", "brief": "", "overlayText": "", "why": "", "styleId": ""}]}`;

  const raw = await generateJSON<{ concepts: Concept[] }>({
    ...auth,
    system: 'You are a top YouTube thumbnail strategist. You think in terms of curiosity gaps, stakes and instantly readable visuals.',
    prompt,
  });
  return (raw.concepts ?? []).slice(0, 3);
}

export async function analyseChannelStyle(auth: Auth, thumbnails: Blob[]): Promise<string> {
  const raw = await generateJSON<{ profile: string }>({
    ...auth,
    system: 'You are an art director describing a YouTube channel’s visual identity so an image model can reproduce it.',
    prompt: `These are thumbnails from one YouTube channel. Describe the recurring visual identity in one dense paragraph (80-120 words), in English, covering: colour palette and grading, typography (weight, case, colour, stroke/shadow, placement), how people are framed and their typical expressions, backgrounds, graphic devices (arrows, circles, glows, outlines), overall energy. Describe the style only, not the specific subjects. Return JSON only: {"profile": "..."}`,
    images: await Promise.all(thumbnails.map(toVisionInput)),
  });
  return raw.profile ?? '';
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
