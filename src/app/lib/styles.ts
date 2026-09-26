/**
 * Thumbnail style presets. Each injects an art-direction fragment into the prompt.
 *
 * Based on current creator practice (1of10, vidIQ 2026 breakout study, Google's
 * Nano Banana guides). Composition rules are conventions, not proven CTR laws:
 * the point is to give the model a coherent, recognisable visual grammar.
 * "The featured person" refers to whoever is attached as a persona, if anyone.
 */
export interface StylePreset {
  id: string;
  name: { en: string; fr: string };
  hint: { en: string; fr: string };
  prompt: string;
}

export const STYLES: StylePreset[] = [
  {
    id: 'reaction',
    name: { en: 'Reaction + object', fr: 'Réaction + objet' },
    hint: { en: 'Entertainment, reviews', fr: 'Divertissement, tests' },
    prompt:
      'Tight close-up of the featured person on one third of the frame, face filling about a third of the image with a genuine, clearly readable reaction. On the other side, one hero object shown big and sharp. Clean saturated background, soft rim light separating the subject.',
  },
  {
    id: 'versus',
    name: { en: 'Versus', fr: 'Versus' },
    hint: { en: 'Comparisons, debates', fr: 'Comparatifs, débats' },
    prompt:
      'Split composition: the first subject on a cool blue left half, the second on a warm orange right half, a bold "VS" badge in the centre. Both at equal scale, crisp studio lighting, strong separation between the halves.',
  },
  {
    id: 'before-after',
    name: { en: 'Before / after', fr: 'Avant / après' },
    hint: { en: 'Transformations, results', fr: 'Transformations, résultats' },
    prompt:
      'Side-by-side before/after with identical framing on both halves. Left half desaturated, dim and flat; right half vibrant, polished and bright. A bold arrow or clean divider between them makes the transformation obvious.',
  },
  {
    id: 'tech',
    name: { en: 'Tech tutorial', fr: 'Tuto tech' },
    hint: { en: 'Dev, software, how-to', fr: 'Dev, logiciels, tutos' },
    prompt:
      'Clean modern tech look: the featured person on one side with a confident expression, next to a floating device or app screen with a crisp, legible interface. Smooth dark gradient background, soft key light, generous empty space.',
  },
  {
    id: 'cinematic',
    name: { en: 'Cinematic documentary', fr: 'Documentaire cinéma' },
    hint: { en: 'History, true crime, essays', fr: 'Histoire, faits divers, essais' },
    prompt:
      'Cinematic wide shot like a film still, dramatic chiaroscuro lighting, muted teal-and-amber grade, subtle film grain, shallow depth of field. Atmosphere and mystery over bright colours.',
  },
  {
    id: 'minimal',
    name: { en: 'Minimal bold', fr: 'Minimaliste' },
    hint: { en: 'Commentary, business', fr: 'Opinion, business' },
    prompt:
      'Minimal graphic design: a flat, bold single-colour background, one small striking element, and lots of empty space. Typography, if any, dominates the frame. Nothing else competes for attention.',
  },
  {
    id: 'story',
    name: { en: 'Story moment', fr: 'Moment clé' },
    hint: { en: 'Challenges, narrative vlogs', fr: 'Défis, vlogs narratifs' },
    prompt:
      'A single frozen moment of tension captured mid-action with a low-angle wide lens. The outcome is visibly unresolved, creating a curiosity gap. Dynamic diagonal composition, natural but punchy colours.',
  },
  {
    id: 'ranking',
    name: { en: 'List / ranking', fr: 'Classement / top' },
    hint: { en: 'Top N, mistakes, tips', fr: 'Tops, erreurs, astuces' },
    prompt:
      'The featured person holding or pointing at one hero item, with a large bold number badge in a top corner and a few smaller items fanned out behind. High-contrast lighting on an uncluttered background.',
  },
  {
    id: 'gaming',
    name: { en: 'Gaming', fr: 'Gaming' },
    hint: { en: "Let's plays, highlights", fr: 'Let’s play, highlights' },
    prompt:
      'Energetic gaming look: the featured person lit by neon purple and cyan with strong rim light, game action exploding behind them, dynamic diagonal composition, glowing accents and high saturation.',
  },
  {
    id: 'finance',
    name: { en: 'Money / finance', fr: 'Argent / finance' },
    hint: { en: 'Finance, crypto, business', fr: 'Finance, crypto, business' },
    prompt:
      'The featured person beside a giant glossy chart arrow (green and rising, or red and crashing, whichever fits the brief), with a clear money-related prop nearby. Dark background, high contrast, serious or shocked expression.',
  },
  {
    id: 'vlog',
    name: { en: 'Vlog / travel', fr: 'Vlog / voyage' },
    hint: { en: 'Travel, lifestyle', fr: 'Voyage, lifestyle' },
    prompt:
      'Candid golden-hour photograph, natural smile, warm film-like colours, shot on a 35mm lens. The location is instantly recognisable and takes a large part of the frame.',
  },
  {
    id: 'hyper',
    name: { en: 'Hyper-saturated', fr: 'Hyper-saturé' },
    hint: { en: 'Big challenges, stakes', fr: 'Gros défis, enjeux' },
    prompt:
      'Ultra-bright, hyper-saturated look with glossy clean lighting and vivid primary colours. People react with wide eyes to something with huge, oversized stakes. Everything is exaggerated in scale and instantly readable.',
  },
  {
    id: 'clay',
    name: { en: '3D / clay', fr: '3D / pâte à modeler' },
    hint: { en: 'Explainers, faceless channels', fr: 'Vulgarisation, chaînes sans visage' },
    prompt:
      'Rendered as a cute, glossy 3D clay diorama with soft studio lighting, a pastel background and a tilt-shift miniature feel. Rounded shapes, playful and tactile.',
  },
  {
    id: 'podcast',
    name: { en: 'Podcast / interview', fr: 'Podcast / interview' },
    hint: { en: 'Interviews, talk shows', fr: 'Interviews, talk-shows' },
    prompt:
      'Two people in close-up facing each other with podcast microphones, blurred studio bokeh behind, soft key light and a subtle rim light. Expressions caught mid-conversation, intense and engaged.',
  },
];

export function findStyle(id: string | undefined): StylePreset | undefined {
  return id ? STYLES.find((s) => s.id === id) : undefined;
}
