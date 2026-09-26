/** Landing page copy. Pages are pre-rendered per language: `/` (fr) and `/en/`. */

export type SiteLang = 'fr' | 'en';

const fr = {
  meta: {
    title: 'NanoThumbnail — Studio IA open source pour miniatures YouTube',
    description:
      'Générez, retouchez et testez vos miniatures YouTube avec Nano Banana. Gratuit, open source, local-first : votre clé, vos images, votre navigateur.',
  },
  nav: { features: 'Fonctionnalités', pricing: 'Prix', faq: 'FAQ', open: 'Ouvrir le studio', github: 'GitHub', switchLang: 'English' },
  hero: {
    badge: 'v2 — le nouveau studio est là',
    title: 'Des miniatures YouTube',
    titleAccent: 'qui donnent envie de cliquer.',
    subtitle:
      'Générez, retouchez et testez vos miniatures avec les modèles Nano Banana de Google. Un studio open source qui tourne dans votre navigateur, avec votre propre clé.',
    cta: 'Ouvrir le studio',
    secondary: 'Voir le code',
    trust: ['Gratuit', 'Open source', 'Aucun compte', 'Vos images restent chez vous'],
  },
  features: {
    eyebrow: 'Tout le cycle',
    title: 'Du brief à l’A/B test, sans quitter l’onglet',
    subtitle: 'Générer ne suffit plus. Ce qui fait une bonne miniature, c’est l’itération : corriger, comparer, vérifier dans le fil.',
    items: [
      { icon: 'wand', title: 'Retouche conversationnelle', desc: 'Dites ce qui cloche (« visage plus surpris », « fond plus sombre ») : seul ce point change. Chaque version est conservée.' },
      { icon: 'mask', title: 'Retouche par zone', desc: 'Peignez une zone, décrivez le changement. Tout le reste est préservé au pixel près.' },
      { icon: 'feed', title: 'Aperçu dans le fil', desc: 'Accueil, recherche, « À suivre », mobile, TV, en clair et en sombre — au milieu des miniatures de vos concurrents.' },
      { icon: 'score', title: 'Score et critique IA', desc: 'Lisibilité en petit, contraste, émotion, curiosité… avec des retouches suggérées applicables en un clic.' },
      { icon: 'ab', title: 'Prêt pour Test & Compare', desc: 'Classez vos variantes puis exportez-en 3 au format YouTube pour l’A/B test natif de YouTube Studio.' },
      { icon: 'people', title: 'Vos visages, fidèles', desc: 'Enregistrez jusqu’à 5 personnes avec leurs angles et expressions : leur identité est préservée.' },
      { icon: 'brand', title: 'Brand kit', desc: 'Couleurs, typo, logo et un profil de style extrait automatiquement de vos meilleures miniatures.' },
      { icon: 'sparkles', title: 'Assistant de concepts', desc: 'À partir de votre titre, trois angles vraiment différents, prêts à générer.' },
      { icon: 'palette', title: '14 styles éprouvés', desc: 'Réaction, versus, avant/après, documentaire, tuto tech… des directions artistiques qui ont fait leurs preuves.' },
    ],
  },
  workflow: {
    title: 'Quatre gestes',
    steps: [
      { title: 'Brief', desc: 'Titre de la vidéo, idée, texte, personnes. Ou laissez l’assistant proposer.' },
      { title: 'Générer', desc: 'Jusqu’à 4 variantes en parallèle, en 1K, 2K ou 4K.' },
      { title: 'Itérer', desc: 'Retouches ciblées, zones, score : on affine au lieu de relancer au hasard.' },
      { title: 'Tester', desc: 'Aperçu dans le fil, comparaison, export Test & Compare.' },
    ],
  },
  gallery: { title: 'Fait avec NanoThumbnail', subtitle: 'Quelques miniatures générées par la communauté.' },
  local: {
    title: 'Local-first. Vraiment.',
    subtitle: 'Pas de serveur à nous, pas de compte, pas de base de données. Votre travail vit dans votre navigateur.',
    items: [
      { title: 'Vos images chez vous', desc: 'Projets, versions, personnes et brand kit sont stockés localement (IndexedDB).' },
      { title: 'Votre clé reste la vôtre', desc: 'Gardée dans le navigateur, ou seulement le temps de la session si vous préférez.' },
      { title: 'Installable, hors ligne', desc: 'Installez le studio comme une app. Votre bibliothèque reste accessible sans réseau.' },
      { title: 'Sauvegarde en un clic', desc: 'Exportez tout dans un zip, réimportez-le sur une autre machine.' },
    ],
  },
  pricing: {
    title: 'Payez les images, pas un abonnement',
    subtitle: 'NanoThumbnail est gratuit. Vous réglez directement Replicate ou Google, au prix coûtant.',
    ours: {
      name: 'NanoThumbnail',
      price: '0 €',
      unit: 'pour le studio',
      note: '+ le coût des images chez le fournisseur : environ 0,07 $ (Nano Banana 2, 1K) à 0,15 $ (Nano Banana Pro)',
      features: ['Toutes les fonctionnalités', 'Votre clé Replicate ou Gemini', 'Aucune commission', 'Données locales'],
      cta: 'Commencer',
    },
    theirs: {
      name: 'Outils SaaS de miniatures',
      price: '20 à 90 $',
      unit: '/ mois',
      features: ['Abonnement récurrent', 'Crédits qui expirent', 'Images sur leurs serveurs', 'Modèle imposé'],
    },
  },
  faq: {
    title: 'Questions fréquentes',
    items: [
      {
        q: 'C’est vraiment gratuit ?',
        a: 'Le studio est gratuit et open source. La génération passe par votre compte Replicate ou Google Gemini, que vous payez directement : quelques centimes par image selon le modèle et la résolution.',
      },
      {
        q: 'Ma clé API est-elle en sécurité ?',
        a: 'Elle est stockée uniquement dans votre navigateur (ou seulement pour la session). Gemini est appelé directement depuis votre navigateur. Replicate n’autorise pas ces appels : les requêtes transitent par une petite fonction Netlify qui les relaie sans rien stocker ni journaliser — le code est public.',
      },
      {
        q: 'Où sont mes images ?',
        a: 'Dans votre navigateur (IndexedDB). Rien n’est envoyé chez nous. Pensez à exporter une sauvegarde depuis les paramètres, surtout si vous changez d’appareil.',
      },
      {
        q: 'Nano Banana Pro ou Nano Banana 2 ?',
        a: 'Pro pour la qualité maximale et le rendu de texte. Nano Banana 2 pour itérer vite et moins cher. Vous pouvez changer à tout moment, même en cours de retouche.',
      },
      {
        q: 'Le score prédit-il mon CTR ?',
        a: 'Non. C’est une critique fondée sur les bonnes pratiques (lisibilité, contraste, émotion…). Pour une vraie mesure, exportez vos variantes vers Test & Compare dans YouTube Studio.',
      },
      {
        q: 'Puis-je utiliser les images commercialement ?',
        a: 'En général oui, mais les conditions dépendent du fournisseur (Replicate, Google). Vérifiez leurs CGU.',
      },
    ],
  },
  cta: { title: 'Votre prochaine miniature commence ici.', subtitle: 'Collez votre clé, écrivez un brief, générez.', button: 'Ouvrir le studio' },
  footer: { made: 'Un projet open source de', legal: 'Mentions légales', privacy: 'Confidentialité', terms: 'CGU' },
};

type Dict = typeof fr;

const en: Dict = {
  meta: {
    title: 'NanoThumbnail — Open-source AI studio for YouTube thumbnails',
    description:
      'Generate, edit and test YouTube thumbnails with Nano Banana. Free, open source, local-first: your key, your images, your browser.',
  },
  nav: { features: 'Features', pricing: 'Pricing', faq: 'FAQ', open: 'Open the studio', github: 'GitHub', switchLang: 'Français' },
  hero: {
    badge: 'v2 — the new studio is here',
    title: 'YouTube thumbnails',
    titleAccent: 'people actually click.',
    subtitle:
      'Generate, edit and test thumbnails with Google’s Nano Banana models. An open-source studio that runs in your browser, with your own key.',
    cta: 'Open the studio',
    secondary: 'View the code',
    trust: ['Free', 'Open source', 'No account', 'Your images stay with you'],
  },
  features: {
    eyebrow: 'The whole loop',
    title: 'From brief to A/B test, in one tab',
    subtitle: 'Generating isn’t enough anymore. Great thumbnails come from iteration: fix, compare, check them in the feed.',
    items: [
      { icon: 'wand', title: 'Conversational edits', desc: 'Say what’s off (“more surprised face”, “darker background”) and only that changes. Every version is kept.' },
      { icon: 'mask', title: 'Area edits', desc: 'Paint an area, describe the change. Everything else stays pixel-identical.' },
      { icon: 'feed', title: 'Feed preview', desc: 'Home, search, up next, mobile, TV, light and dark — right among your competitors’ thumbnails.' },
      { icon: 'score', title: 'AI score & critique', desc: 'Small-size legibility, contrast, emotion, curiosity… with suggested edits you apply in one click.' },
      { icon: 'ab', title: 'Ready for Test & Compare', desc: 'Rank your variants, then export 3 in YouTube spec for YouTube Studio’s native A/B test.' },
      { icon: 'people', title: 'Faithful faces', desc: 'Save up to 5 people with their angles and expressions — their identity is preserved.' },
      { icon: 'brand', title: 'Brand kit', desc: 'Colours, type, logo, and a style profile extracted automatically from your best thumbnails.' },
      { icon: 'sparkles', title: 'Concept assistant', desc: 'From your title, three genuinely different angles, ready to generate.' },
      { icon: 'palette', title: '14 proven styles', desc: 'Reaction, versus, before/after, documentary, tech tutorial… art directions that work.' },
    ],
  },
  workflow: {
    title: 'Four moves',
    steps: [
      { title: 'Brief', desc: 'Video title, idea, text, people. Or let the assistant suggest.' },
      { title: 'Generate', desc: 'Up to 4 variants in parallel, at 1K, 2K or 4K.' },
      { title: 'Iterate', desc: 'Targeted edits, areas, score: refine instead of re-rolling blindly.' },
      { title: 'Test', desc: 'Feed preview, side-by-side comparison, Test & Compare export.' },
    ],
  },
  gallery: { title: 'Made with NanoThumbnail', subtitle: 'A few thumbnails generated by the community.' },
  local: {
    title: 'Local-first. For real.',
    subtitle: 'No server of ours, no account, no database. Your work lives in your browser.',
    items: [
      { title: 'Your images, your device', desc: 'Projects, versions, people and brand kit are stored locally (IndexedDB).' },
      { title: 'Your key stays yours', desc: 'Kept in your browser — or only for the session if you prefer.' },
      { title: 'Installable, offline', desc: 'Install the studio as an app. Your library stays available without network.' },
      { title: 'One-click backup', desc: 'Export everything as a zip, import it on another machine.' },
    ],
  },
  pricing: {
    title: 'Pay for images, not a subscription',
    subtitle: 'NanoThumbnail is free. You pay Replicate or Google directly, at cost.',
    ours: {
      name: 'NanoThumbnail',
      price: '$0',
      unit: 'for the studio',
      note: '+ image cost at the provider: about $0.07 (Nano Banana 2, 1K) to $0.15 (Nano Banana Pro)',
      features: ['Every feature', 'Your Replicate or Gemini key', 'No markup', 'Local data'],
      cta: 'Get started',
    },
    theirs: {
      name: 'SaaS thumbnail tools',
      price: '$20–90',
      unit: '/ month',
      features: ['Recurring subscription', 'Expiring credits', 'Images on their servers', 'Model chosen for you'],
    },
  },
  faq: {
    title: 'Frequently asked questions',
    items: [
      {
        q: 'Is it really free?',
        a: 'The studio is free and open source. Generation runs on your Replicate or Google Gemini account, which you pay directly: a few cents per image depending on model and resolution.',
      },
      {
        q: 'Is my API key safe?',
        a: 'It’s stored only in your browser (or only for the session). Gemini is called directly from your browser. Replicate doesn’t allow browser calls, so requests go through a tiny Netlify function that relays them without storing or logging anything — the code is public.',
      },
      {
        q: 'Where are my images?',
        a: 'In your browser (IndexedDB). Nothing is sent to us. Export a backup from Settings, especially before switching devices.',
      },
      {
        q: 'Nano Banana Pro or Nano Banana 2?',
        a: 'Pro for maximum quality and text rendering. Nano Banana 2 to iterate fast and cheaper. Switch anytime, even mid-edit.',
      },
      {
        q: 'Does the score predict my CTR?',
        a: 'No. It’s a critique based on best practices (legibility, contrast, emotion…). For a real measurement, export your variants to Test & Compare in YouTube Studio.',
      },
      {
        q: 'Can I use the images commercially?',
        a: 'Generally yes, but terms depend on the provider (Replicate, Google). Check their terms.',
      },
    ],
  },
  cta: { title: 'Your next thumbnail starts here.', subtitle: 'Paste your key, write a brief, generate.', button: 'Open the studio' },
  footer: { made: 'An open-source project by', legal: 'Legal notice', privacy: 'Privacy', terms: 'Terms' },
};

export const site: Record<SiteLang, Dict> = { fr, en };
