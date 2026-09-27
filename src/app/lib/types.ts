export type Provider = 'replicate' | 'gemini' | 'openrouter';
export type ModelId = 'nano-banana-pro' | 'nano-banana-2';
export type AspectRatio = '16:9' | '9:16' | '4:3' | '1:1' | '21:9';
export type Resolution = '1K' | '2K' | '4K';
export type OutputFormat = 'png' | 'jpg';
export type SafetyLevel = 'block_only_high' | 'block_medium_and_above' | 'block_low_and_above';

export interface GenerationParams {
  provider: Provider;
  model: ModelId;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  format: OutputFormat;
  safety: SafetyLevel;
}

/** How an image came to exist: fresh generation, whole-image edit, masked edit, or imported. */
export type GenerationKind = 'generate' | 'edit' | 'region' | 'import';

export interface ScoreCriterion {
  key: 'legibility' | 'contrast' | 'focal' | 'emotion' | 'curiosity' | 'mobile';
  score: number; // 0-10
  comment: string;
}

export interface Score {
  overall: number; // 0-100
  criteria: ScoreCriterion[];
  strengths: string[];
  improvements: string[];
  /** Ready-to-use edit instructions the user can apply in one click. */
  suggestedEdits: string[];
  createdAt: number;
}

export interface Generation {
  id: string;
  projectId: string;
  /** Image this one was derived from (edit / region edit). */
  parentId?: string;
  kind: GenerationKind;
  /** What the user typed (brief or edit instruction). */
  prompt: string;
  /** Exact prompt sent to the model, kept for transparency and reuse. */
  fullPrompt: string;
  videoTitle?: string;
  params: GenerationParams;
  blob: Blob;
  width: number;
  height: number;
  createdAt: number;
  favorite?: boolean;
  score?: Score;
}

export interface Project {
  id: string;
  name: string;
  videoTitle?: string;
  createdAt: number;
  updatedAt: number;
}

export type PersonaPhotoSlot = 'front' | 'left' | 'right' | 'expression';

export interface PersonaPhoto {
  id: string;
  slot: PersonaPhotoSlot;
  /** Free label for expression photos, e.g. "surprised", "laughing". */
  expression?: string;
  blob: Blob;
}

export interface Persona {
  id: string;
  name: string;
  description?: string;
  photos: PersonaPhoto[];
  createdAt: number;
}

export interface LibraryImage {
  id: string;
  blob: Blob;
  createdAt: number;
}

export interface BrandKit {
  id: 'default';
  enabled: boolean;
  channelName: string;
  colors: string[];
  fontStyle: string;
  notes: string;
  logo?: Blob;
  /** Natural-language style description distilled from the channel's own thumbnails. */
  styleProfile: string;
  /** A few of the channel's own thumbnails, sent as style references. */
  styleRefs: Blob[];
  sendStyleRefs: boolean;
  updatedAt: number;
}

export type RefSource = 'upload' | 'persona' | 'library' | 'history' | 'youtube';

/** An image attached to the current brief. */
export interface RefImage {
  id: string;
  blob: Blob;
  source: RefSource;
  personaId?: string;
  label?: string;
}
