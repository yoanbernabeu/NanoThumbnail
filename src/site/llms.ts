import { site, type SiteLang } from './i18n';
import { STYLES } from '../app/lib/styles';

/**
 * llms.txt (https://llmstxt.org): a concise, markdown summary written for LLMs
 * and AI agents, generated from the same copy as the landing so it never drifts.
 */

const SITE = 'https://nanothumbnail.com';
const REPO = 'https://github.com/yoanbernabeu/NanoThumbnail';

export function llmsTxt(): string {
  const c = site.en;
  return `# NanoThumbnail

> ${c.meta.description}

NanoThumbnail is a free, MIT-licensed web app (a "studio") to create YouTube thumbnails with Google's Nano Banana image models (Nano Banana Pro and Nano Banana 2). It is bring-your-own-key: users paste a Replicate or Google Gemini API key and pay the provider directly. There is no account and no server-side storage: projects, images, people and brand kit are stored in the browser (IndexedDB). The interface is available in English and French.

Key facts:
- Price: the studio is free. Image generation costs roughly $0.07 (Nano Banana 2, 1K) to $0.15 (Nano Banana Pro) per image at the provider.
- Providers: Replicate (\`google/nano-banana-pro\`, \`google/nano-banana-2\`) or Google Gemini API (\`gemini-3-pro-image\`, \`gemini-3.1-flash-image\`).
- Output: 16:9, 9:16, 4:3 or 1:1; 1K, 2K or 4K; 1 to 4 variants per generation.
- Main workflow: brief → generate → iterate (conversational edits, masked area edits) → test (feed preview, AI critique, side-by-side ranking, export for YouTube Studio "Test & Compare").
- The AI score is a best-practice critique, not a CTR prediction.

## Pages

- [Home (English)](${SITE}/en/): product overview, features, pricing, FAQ
- [Accueil (français)](${SITE}/): same content in French
- [Studio](${SITE}/app/): the web app itself (client-side, requires an API key)
- [Full documentation for LLMs](${SITE}/llms-full.txt): every feature, FAQ and style preset

## Source

- [GitHub repository](${REPO}): code, README, MIT license
- [README](${REPO}#readme): architecture, how prompts are built, local development

## Optional

- [Privacy policy](${SITE}/privacy-policy/)
- [Terms of service](${SITE}/terms-of-service/)
- [Legal notice](${SITE}/legal-notice/)
`;
}

function section(lang: SiteLang): string {
  const c = site[lang];
  const lines: string[] = [];
  lines.push(`## ${lang === 'fr' ? 'Version française' : 'English version'}`, '');
  lines.push(`### ${c.hero.title} ${c.hero.titleAccent}`, '', c.hero.subtitle, '');
  lines.push(`### ${c.studio.title}`, '', c.studio.subtitle, '');
  lines.push(`### ${c.iterate.title}`, '', c.iterate.subtitle, '');
  c.iterate.steps.forEach((s, i) => lines.push(`${i + 1}. **${s.label}** — ${s.text}`));
  lines.push('');
  for (const row of c.rows) {
    lines.push(`### ${row.eyebrow}: ${row.title}`, '', row.text, '', ...row.points.map((p) => `- ${p}`), '');
  }
  lines.push(`### ${c.feed.eyebrow}: ${c.feed.title}`, '', c.feed.text, '');
  lines.push(`### ${c.extras.title}`, '');
  for (const item of c.extras.items) lines.push(`- **${item.title}** — ${item.text}`);
  lines.push('', `### ${c.bento.title}`, '');
  for (const item of Object.values(c.bento.items)) lines.push(`- **${item.title}** — ${item.text}`);
  lines.push('', `### ${lang === 'fr' ? 'Styles prédéfinis' : 'Style presets'}`, '');
  for (const s of STYLES) lines.push(`- **${s.name[lang]}** (${s.hint[lang]})`);
  lines.push('', `### ${c.pricing.title}`, '', c.pricing.subtitle, '', `- ${c.pricing.ours.name}: ${c.pricing.ours.price} ${c.pricing.ours.unit}. ${c.pricing.ours.note}`, '');
  lines.push(`### ${c.faq.title}`, '');
  for (const item of c.faq.items) lines.push(`**${item.q}**`, '', item.a, '');
  return lines.join('\n');
}

export function llmsFullTxt(): string {
  return `${llmsTxt()}
---

${section('en')}
---

${section('fr')}`;
}
