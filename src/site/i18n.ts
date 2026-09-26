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
    badge: 'Nouveau · NanoThumbnail v2',
    title: 'La miniature parfaite,',
    titleAccent: 'retouche après retouche.',
    subtitle:
      'Générez avec Nano Banana, corrigez d’une phrase, vérifiez dans le fil YouTube, faites noter par l’IA. Le studio open source qui tourne dans votre navigateur, avec votre propre clé.',
    cta: 'Ouvrir le studio — gratuit',
    secondary: 'Voir le code',
    trust: ['Gratuit & open source', 'Aucun compte', 'Vos images restent chez vous'],
    chips: {
      score: 'Score IA',
      style: 'Style',
      styleValue: 'Hyper-saturé',
      edit: 'Retire la main en trop',
      editDone: 'Retouche appliquée',
      variants: '4 variantes · 4K',
      model: 'Nano Banana Pro',
    },
  },
  studio: {
    eyebrow: 'Le studio',
    title: 'Tout le cycle d’une miniature, dans un seul écran',
    subtitle: 'Brief à gauche, image au centre, itération à droite. Chaque version est gardée dans la pellicule du projet.',
  },
  iterate: {
    eyebrow: 'Retouche conversationnelle',
    title: 'Ne relancez plus au hasard. Retouchez.',
    subtitle:
      'Décrivez ce qui ne va pas, en une phrase. Le visage, la lumière et la composition restent identiques : seul ce que vous demandez change.',
    steps: [
      { label: 'Génération', text: 'Style hyper-saturé, sans texte' },
      { label: 'Retouche', text: '« Remplace le laptop par une plaque YouTube Silver »' },
      { label: 'Retouche de zone', text: '« Retire la main en trop »' },
    ],
  },
  rows: [
    {
      key: 'mask',
      eyebrow: 'Retouche par zone',
      title: 'Peignez. Décrivez. Seule cette zone change.',
      text: 'Un détail cloche ? Sélectionnez-le au pinceau et dites ce que vous voulez. Tout ce qui est hors de la sélection est conservé au pixel près — garanti, pas espéré.',
      points: ['Pinceau et gomme', 'Fusion adoucie avec l’original', 'Chaque retouche devient une version'],
    },
    {
      key: 'score',
      eyebrow: 'Score & critique IA',
      title: 'Un œil expert avant de publier',
      text: 'Lisibilité en petit, contraste, point focal, émotion, curiosité, lisibilité mobile : chaque critère est noté et justifié, avec des retouches suggérées applicables en un clic.',
      points: ['6 critères notés sur 10', 'Retouches suggérées en un clic', 'En français ou en anglais'],
    },
    {
      key: 'compare',
      eyebrow: 'Comparer & Test & Compare',
      title: 'Choisissez la gagnante, puis laissez YouTube trancher',
      text: 'Mettez vos variantes côte à côte, laissez l’IA les classer, puis exportez-en trois au format YouTube pour l’A/B test natif de YouTube Studio.',
      points: ['Classement argumenté', 'Export 1280×720, moins de 2 Mo', 'Prêt pour « Tester et comparer »'],
    },
  ],
  feed: {
    eyebrow: 'Aperçu dans le fil',
    title: 'Voyez-la là où elle sera vue',
    text: 'Accueil, recherche, « À suivre », mobile et TV, en clair comme en sombre, au milieu des miniatures de votre niche. Plus des zones de sécurité pour ne jamais cacher l’essentiel sous la durée.',
    tabs: ['Accueil', 'Recherche', 'À suivre', 'Mobile', 'TV'],
    yourTitle: 'J’ai enfin publié ma première vidéo YouTube',
    channel: 'Votre chaîne',
    meta: 'il y a 2 heures',
  },
  bento: {
    title: 'Et tout ce qu’il faut autour',
    items: {
      people: { title: 'Vos visages, fidèles', text: 'Même visage d’une image à l’autre. Jusqu’à 5 personnes par miniature, avec leurs angles et leurs expressions.' },
      brand: { title: 'Brand kit', text: 'Couleurs, typo, logo, et un profil de style extrait de vos meilleures miniatures.' },
      concepts: { title: 'Assistant de concepts', text: 'Trois angles vraiment différents à partir de votre titre.', samples: ['Réaction', 'Avant / après', 'Mystère'] },
      styles: { title: '14 styles éprouvés', text: 'Des directions artistiques qui marchent, prêtes à l’emploi.' },
      text: { title: 'Texte net ou espace libre', text: 'L’IA écrit le texte, ou laisse la place propre pour l’ajouter vous-même.' },
      local: { title: '100 % local', text: 'Projets, versions et visages restent dans votre navigateur. Sauvegarde zip en un clic.' },
      pwa: { title: 'Installable', text: 'Une vraie app, même hors ligne pour consulter votre bibliothèque.' },
      keys: { title: 'Votre clé, vos règles', text: 'Replicate ou Gemini, mémorisée ou juste pour la session.' },
    },
  },
  stats: [
    { value: '0 €', label: 'pour le studio' },
    { value: '14', label: 'styles prêts à l’emploi' },
    { value: '4K', label: 'résolution max.' },
    { value: '100 %', label: 'dans votre navigateur' },
  ],
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
  cta: { title: 'Votre prochaine miniature commence ici.', subtitle: 'Collez votre clé, écrivez un brief, générez. C’est tout.', button: 'Ouvrir le studio' },
  alts: {
    hero: 'Miniature YouTube générée avec NanoThumbnail : un homme barbu, bouche ouverte de joie, brandit une plaque YouTube Silver Play Button',
    studio: 'Capture du studio NanoThumbnail : brief à gauche, miniature au centre, historique des versions et retouches rapides à droite',
    steps: ['Version générée : homme surpris devant un laptop affichant un bouton YouTube', 'Première retouche : le laptop est remplacé par une plaque YouTube', 'Retouche de zone : la main en trop a été retirée'],
    mask: 'Retouche par zone : une main est peinte en magenta avant d’être supprimée',
    score: 'Panneau de score IA : note globale de 72 sur 100 et six critères détaillés',
    compare: 'Vue Comparer : trois variantes classées par l’IA avec leurs justifications',
    og: 'NanoThumbnail — La miniature parfaite, retouche après retouche',
  },
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
    badge: 'New · NanoThumbnail v2',
    title: 'The perfect thumbnail,',
    titleAccent: 'one edit at a time.',
    subtitle:
      'Generate with Nano Banana, fix it in one sentence, check it in the YouTube feed, get an AI critique. The open-source studio that runs in your browser, with your own key.',
    cta: 'Open the studio — free',
    secondary: 'View the code',
    trust: ['Free & open source', 'No account', 'Your images stay with you'],
    chips: {
      score: 'AI score',
      style: 'Style',
      styleValue: 'Hyper-saturated',
      edit: 'Remove the extra hand',
      editDone: 'Edit applied',
      variants: '4 variants · 4K',
      model: 'Nano Banana Pro',
    },
  },
  studio: {
    eyebrow: 'The studio',
    title: 'A thumbnail’s whole lifecycle, on one screen',
    subtitle: 'Brief on the left, image in the middle, iteration on the right. Every version is kept in the project filmstrip.',
  },
  iterate: {
    eyebrow: 'Conversational edits',
    title: 'Stop re-rolling. Start editing.',
    subtitle: 'Describe what’s wrong in one sentence. The face, lighting and composition stay the same — only what you ask for changes.',
    steps: [
      { label: 'Generation', text: 'Hyper-saturated style, no text' },
      { label: 'Edit', text: '“Replace the laptop with a YouTube Silver Play Button”' },
      { label: 'Area edit', text: '“Remove the extra hand”' },
    ],
  },
  rows: [
    {
      key: 'mask',
      eyebrow: 'Area edits',
      title: 'Paint. Describe. Only that area changes.',
      text: 'Something’s off? Brush over it and say what you want. Everything outside the selection is kept pixel-for-pixel — guaranteed, not hoped for.',
      points: ['Brush and eraser', 'Feathered blend with the original', 'Every edit becomes a version'],
    },
    {
      key: 'score',
      eyebrow: 'AI score & critique',
      title: 'An expert eye before you publish',
      text: 'Small-size legibility, contrast, focal point, emotion, curiosity, mobile readability: each criterion scored and explained, with suggested edits you apply in one click.',
      points: ['6 criteria scored out of 10', 'One-click suggested edits', 'In English or French'],
    },
    {
      key: 'compare',
      eyebrow: 'Compare & Test & Compare',
      title: 'Pick the winner, then let YouTube decide',
      text: 'Put your variants side by side, let the AI rank them, then export three in YouTube spec for YouTube Studio’s native A/B test.',
      points: ['Ranking with reasons', '1280×720 export, under 2 MB', 'Ready for Test & Compare'],
    },
  ],
  feed: {
    eyebrow: 'Feed preview',
    title: 'See it where it will be seen',
    text: 'Home, search, up next, mobile and TV, in light and dark, among the thumbnails of your niche. Plus safe zones so nothing important hides under the duration badge.',
    tabs: ['Home', 'Search', 'Up next', 'Mobile', 'TV'],
    yourTitle: 'I finally published my first YouTube video',
    channel: 'Your channel',
    meta: '2 hours ago',
  },
  bento: {
    title: 'And everything around it',
    items: {
      people: { title: 'Faithful faces', text: 'The same face from one image to the next. Up to 5 people per thumbnail, with their angles and expressions.' },
      brand: { title: 'Brand kit', text: 'Colours, type, logo, and a style profile distilled from your best thumbnails.' },
      concepts: { title: 'Concept assistant', text: 'Three genuinely different angles from your title.', samples: ['Reaction', 'Before / after', 'Mystery'] },
      styles: { title: '14 proven styles', text: 'Art directions that work, ready to use.' },
      text: { title: 'Crisp text or clean space', text: 'The AI writes the text, or leaves clean space for you to add it.' },
      local: { title: '100% local', text: 'Projects, versions and faces stay in your browser. One-click zip backup.' },
      pwa: { title: 'Installable', text: 'A real app, even offline to browse your library.' },
      keys: { title: 'Your key, your rules', text: 'Replicate or Gemini, remembered or just for the session.' },
    },
  },
  stats: [
    { value: '$0', label: 'for the studio' },
    { value: '14', label: 'ready-made styles' },
    { value: '4K', label: 'max resolution' },
    { value: '100%', label: 'in your browser' },
  ],
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
  cta: { title: 'Your next thumbnail starts here.', subtitle: 'Paste your key, write a brief, generate. That’s it.', button: 'Open the studio' },
  alts: {
    hero: 'YouTube thumbnail made with NanoThumbnail: a bearded man, mouth open with joy, holding a YouTube Silver Play Button',
    studio: 'NanoThumbnail studio screenshot: brief on the left, thumbnail in the middle, version history and quick edits on the right',
    steps: ['Generated version: surprised man in front of a laptop showing a YouTube button', 'First edit: the laptop is replaced by a YouTube plaque', 'Area edit: the extra hand has been removed'],
    mask: 'Area edit: a hand is painted in magenta before being removed',
    score: 'AI score panel: overall 72 out of 100 and six detailed criteria',
    compare: 'Compare view: three variants ranked by the AI with their reasons',
    og: 'NanoThumbnail — The perfect thumbnail, one edit at a time',
  },
  footer: { made: 'An open-source project by', legal: 'Legal notice', privacy: 'Privacy', terms: 'Terms' },
};

export const site: Record<SiteLang, Dict> = { fr, en };
