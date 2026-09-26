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
      scoreValue: 65,
      style: 'Style',
      styleValue: 'Tuto tech',
      edit: 'Remplace « 100K » par « 1M »',
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
      { label: 'Génération', text: 'Style « Tuto tech », texte « 0 → 100K »' },
      { label: 'Retouche', text: '« Passe tout l’accent bleu en orange vif »' },
      { label: 'Retouche', text: '« Remplace “100K” par “1M”, même style »' },
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
    text: 'Accueil, recherche, « À suivre », mobile et TV, en clair comme en sombre, au milieu des miniatures de votre niche.',
    safeTitle: 'Zones de sécurité',
    safeText: 'Durée de la vidéo, icônes au survol, barre de progression : affichez ce que YouTube recouvre, pour ne jamais y cacher l’essentiel.',
    tabs: ['Accueil', 'Recherche', 'À suivre', 'Mobile', 'TV'],
    yourTitle: 'De 0 à 1 million d’abonnés : ce que j’ai appris en tant que dev',
    channel: 'Votre chaîne',
    meta: 'il y a 2 heures',
  },
  extras: {
    title: 'Pensé pour aller vite',
    items: [
      { key: 'concepts', title: 'Assistant de concepts', text: 'Donnez votre titre : trois angles vraiment différents, avec brief, texte et style, prêts à générer.' },
      { key: 'styles', title: '14 styles éprouvés', text: 'Réaction, versus, tuto tech, documentaire… une direction artistique en un clic.' },
      { key: 'commands', title: 'Tout au clavier', text: 'Palette ⌘K, ⌘↵ pour générer, F pour l’aperçu du fil, Z pour les zones, M pour le masque.' },
    ],
  },
  bento: {
    title: 'Et tout ce qu’il faut autour',
    items: {
      people: { title: 'Vos visages, fidèles', text: 'Même visage d’une image à l’autre. Jusqu’à 5 personnes par miniature, avec leurs angles et leurs expressions.' },
      brand: { title: 'Brand kit', text: 'Couleurs, typo, logo, et un profil de style extrait de vos meilleures miniatures.' },
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
    hero: 'Miniature YouTube générée avec NanoThumbnail : un développeur barbu en sweat noir, bras croisés, à côté d’un graphique d’abonnés, avec le texte « 0 → 1M »',
    studio: 'Capture du studio NanoThumbnail : brief à gauche, miniature au centre, historique des versions et retouches rapides à droite',
    steps: ['Version générée : accent bleu, texte « 0 → 100K »', 'Première retouche : tout l’accent passe en orange', 'Deuxième retouche : le texte devient « 0 → 1M »'],
    mask: 'Retouche par zone : le texte « 100K » est peint en magenta pour être modifié',
    score: 'Panneau de score IA : note globale de 65 sur 100 et six critères détaillés',
    safezones: 'Zones de sécurité affichées sur la miniature : durée, icônes au survol, barre de progression',
    concepts: 'Assistant de concepts : trois propositions différentes pour la même vidéo',
    styles: 'Sélecteur des 14 styles prédéfinis',
    commands: 'Palette de commandes ⌘K',
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
      scoreValue: 62,
      style: 'Style',
      styleValue: 'Tech tutorial',
      edit: 'Replace “100K” with “1M”',
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
      { label: 'Generation', text: '“Tech tutorial” style, text “0 → 100K”' },
      { label: 'Edit', text: '“Switch every blue accent to bright orange”' },
      { label: 'Edit', text: '“Replace ‘100K’ with ‘1M’, same style”' },
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
    text: 'Home, search, up next, mobile and TV, in light and dark, among the thumbnails of your niche.',
    safeTitle: 'Safe zones',
    safeText: 'Duration badge, hover icons, progress bar: see what YouTube covers, so nothing important ever hides there.',
    tabs: ['Home', 'Search', 'Up next', 'Mobile', 'TV'],
    yourTitle: 'From 0 to 1 million subscribers: what I learned as a developer',
    channel: 'Your channel',
    meta: '2 hours ago',
  },
  extras: {
    title: 'Built for speed',
    items: [
      { key: 'concepts', title: 'Concept assistant', text: 'Give it your title: three genuinely different angles, with brief, text and style, ready to generate.' },
      { key: 'styles', title: '14 proven styles', text: 'Reaction, versus, tech tutorial, documentary… an art direction in one click.' },
      { key: 'commands', title: 'Keyboard-first', text: '⌘K palette, ⌘↵ to generate, F for feed preview, Z for safe zones, M for the mask.' },
    ],
  },
  bento: {
    title: 'And everything around it',
    items: {
      people: { title: 'Faithful faces', text: 'The same face from one image to the next. Up to 5 people per thumbnail, with their angles and expressions.' },
      brand: { title: 'Brand kit', text: 'Colours, type, logo, and a style profile distilled from your best thumbnails.' },
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
    hero: 'YouTube thumbnail made with NanoThumbnail: a bearded developer in a black hoodie, arms crossed, next to a subscriber chart, with the text “0 → 1M”',
    studio: 'NanoThumbnail studio screenshot: brief on the left, thumbnail in the middle, version history and quick edits on the right',
    steps: ['Generated version: blue accent, text “0 → 100K”', 'First edit: every accent turns orange', 'Second edit: the text becomes “0 → 1M”'],
    mask: 'Area edit: the “100K” text is painted in magenta to be changed',
    score: 'AI score panel: overall 62 out of 100 and six detailed criteria',
    safezones: 'Safe zones shown on the thumbnail: duration badge, hover icons, progress bar',
    concepts: 'Concept assistant: three different proposals for the same video',
    styles: 'Picker for the 14 style presets',
    commands: '⌘K command palette',
    compare: 'Compare view: three variants ranked by the AI with their reasons',
    og: 'NanoThumbnail — The perfect thumbnail, one edit at a time',
  },
  footer: { made: 'An open-source project by', legal: 'Legal notice', privacy: 'Privacy', terms: 'Terms' },
};

export const site: Record<SiteLang, Dict> = { fr, en };
