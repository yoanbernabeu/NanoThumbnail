import type { APIRoute } from 'astro';

const SITE = 'https://nanothumbnail.com';
const lastmod = new Date().toISOString().slice(0, 10);

// Home pages exist in both languages; legal pages are English only. The studio (/app) is noindex.
const pages: Array<{ fr?: string; en: string; priority: string }> = [
  { fr: '/', en: '/en/', priority: '1.0' },
  { en: '/legal-notice/', priority: '0.2' },
  { en: '/privacy-policy/', priority: '0.2' },
  { en: '/terms-of-service/', priority: '0.2' },
];

export const GET: APIRoute = () => {
  const urls = pages.flatMap((p) => {
    const variants = (['fr', 'en'] as const).filter((l) => p[l]);
    const links = variants.length > 1
      ? variants.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE}${p[l]}"/>`).join('\n') +
        `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${p.en}"/>`
      : '';
    return variants.map(
      (l) => `  <url>
    <loc>${SITE}${p[l]}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>${p.priority}</priority>${links ? `\n${links}` : ''}
  </url>`,
    );
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
