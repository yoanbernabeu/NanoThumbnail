/** Landing page copy. Pages are pre-rendered per language: `/` (fr) and `/en/`. */

export type SiteLang = 'fr' | 'en';

const fr = {
  meta: {
    title: 'NanoThumbnail — Studio IA open source pour miniatures YouTube',
    description:
      'Générez, retouchez et testez vos miniatures YouTube avec Nano Banana. Gratuit, open source, local-first : votre clé, vos images, votre navigateur.',
  },
  nav: { features: 'Fonctionnalités', gallery: 'Galerie', pricing: 'Prix', faq: 'FAQ', open: 'Ouvrir le studio', github: 'GitHub', switchLang: 'English' },
  hero: {
    badge: 'Propulsé par Nano Banana Pro et Nano Banana 2',
    title: 'La miniature parfaite,',
    titleAccent: 'retouche après retouche.',
    subtitle:
      'Générez avec Nano Banana, corrigez d’une phrase, vérifiez dans le fil YouTube, faites noter par l’IA. Le studio open source qui tourne dans votre navigateur, avec votre propre clé.',
    cta: 'Ouvrir le studio — gratuit',
    secondary: 'Voir comment ça marche',
    trust: ['Gratuit & open source', 'Pas d’inscription chez nous', 'Vos images restent chez vous'],
    chips: {
      score: 'Score IA',
      scoreValue: 81,
      style: 'Style',
      styleValue: 'Réaction + objet',
      edits: ['Ajoute une flèche rouge vers le téléphone', 'Passe le texte en jaune vif'],
      editDone: 'Retouche appliquée',
      variants: '4 variantes',
      model: 'Nano Banana 2',
    },
  },
  studio: {
    eyebrow: 'Le studio',
    title: 'Tout le cycle d’une miniature, dans un seul écran',
    subtitle: 'Brief à gauche, image au centre, itération à droite. Chaque version est gardée dans la pellicule du projet.',
  },
  gallery: {
    eyebrow: 'Galerie',
    title: 'Un style pour chaque niche',
    subtitle: 'Chacune de ces miniatures a été générée dans NanoThumbnail à partir d’un brief de quelques lignes, avec l’un des 14 styles prêts à l’emploi, parfois suivi d’une ou deux retouches.',
    note: 'Besoin d’une version dans une autre langue ? Une retouche suffit : «\u00a0Remplace le texte par…\u00a0»',
    titles: {
      reaction: 'J’ai testé le plus petit smartphone du monde',
      versus: 'Friteuse à air contre four : lequel gagne ?',
      'before-after': 'J’ai rénové mon salon avec 3 000 €',
      tech: 'Apprendre Rust en 10 minutes',
      cinematic: 'Le dernier pêcheur de l’île',
      minimal: 'Je me lève à 5 h depuis un an',
      story: 'Perdue seule en Islande pendant 3 jours',
      ranking: 'Top 5 des voitures électriques à moins de 30 000 €',
      gaming: 'J’ai fini le jeu sans mourir une seule fois',
      finance: 'Investir 100 € par mois pendant 20 ans',
      vlog: '48 h à Tokyo avec 200 €',
      hyper: 'Le plus grand geyser de soda jamais réalisé',
      clay: 'Tacos maison : la vraie recette',
      podcast: 'Elle a tout quitté à 50 ans pour ouvrir sa boulangerie',
    },
  },
  iterate: {
    eyebrow: 'Retouche conversationnelle',
    title: 'Ne relancez plus au hasard. Retouchez.',
    subtitle:
      'Décrivez ce qui ne va pas, en une phrase. Le visage, la lumière et la composition restent identiques : seul ce que vous demandez change.',
    steps: [
      { label: 'Génération', text: 'Style «\u00a0Réaction + objet\u00a0», texte «\u00a0MINI ?!\u00a0»' },
      { label: 'Retouche', text: '«\u00a0Ajoute une grosse flèche rouge vers le téléphone\u00a0»' },
      { label: 'Retouche', text: '«\u00a0Passe le texte en jaune vif avec un contour noir\u00a0»' },
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
    yourTitle: 'J’ai testé le plus petit smartphone du monde',
    channel: 'Votre chaîne',
    meta: 'il y a 2 heures',
    others: [
      { channel: 'Code & Café', meta: '84 k vues · il y a 3 jours' },
      { channel: 'Cuisine Maligne', meta: '1,2 M vues · il y a 1 mois' },
      { channel: 'Les Bons Plans Tech', meta: '312 k vues · il y a 2 semaines' },
      { channel: 'Pixel Arena', meta: '2,4 M vues · il y a 5 jours' },
      { channel: 'Petit Budget', meta: '97 k vues · il y a 1 semaine' },
    ],
  },
  extras: {
    title: 'Pensé pour aller vite',
    items: [
      { key: 'concepts', title: 'Assistant de concepts', text: 'Donnez votre titre : trois angles vraiment différents, avec brief, texte et style, prêts à générer.' },
      { key: 'commands', title: 'Tout au clavier', text: 'Palette ⌘K, ⌘↵ pour générer, F pour l’aperçu du fil, Z pour les zones, M pour le masque.' },
    ],
  },
  bento: {
    title: 'Pensé pour aller vite, avec tout ce qu’il faut autour',
    items: {
      people: { title: 'Vos visages, fidèles', text: 'Même visage d’une image à l’autre. Jusqu’à 5 personnes par miniature, avec leurs angles et leurs expressions.' },
      brand: { title: 'Brand kit', text: 'Couleurs, typo, logo, et un profil de style extrait de vos meilleures miniatures.' },
      text: { title: 'Texte net ou espace libre', text: 'L’IA écrit le texte, ou laisse la place propre pour l’ajouter vous-même.' },
      local: { title: '100 % local', text: 'Projets, versions et visages restent dans votre navigateur. Sauvegarde zip en un clic.' },
      pwa: { title: 'Installable', text: 'Une vraie app, même hors ligne pour consulter votre bibliothèque.' },
      keys: { title: 'Votre clé, vos règles', text: 'Replicate ou Gemini, mémorisée ou juste pour la session.' },
    },
  },
  start: {
    eyebrow: 'Démarrer',
    title: 'Prêt en 2 minutes',
    subtitle: 'NanoThumbnail utilise votre propre clé d’API : vous payez les images directement au fournisseur, sans intermédiaire.',
    steps: [
      { title: 'Créez une clé d’API', text: 'Chez Google AI Studio (Gemini) ou chez Replicate. Quelques clics, avec votre compte Google ou GitHub.' },
      { title: 'Collez-la dans le studio', text: 'Elle reste dans votre navigateur, mémorisée ou seulement pour la session.' },
      { title: 'Écrivez un brief, générez', text: 'Quatre variantes en une trentaine de secondes. Retouchez, comparez, exportez.' },
    ],
    links: { gemini: 'Clé Google AI Studio', replicate: 'Clé Replicate' },
    cost: 'Environ 0,07 à 0,15 $ par image : 100 miniatures coûtent 7 à 15 $.',
  },
  maker: {
    eyebrow: 'Par un créateur, pour les créateurs',
    title: 'Fait par quelqu’un qui publie aussi sur YouTube',
    text: 'NanoThumbnail est développé par Yoan Bernabeu, développeur et créateur de la chaîne YouTube YoanDev, suivie par plus de 23 000 abonnés. Le projet est open source sous licence MIT : le code est public, les idées et contributions sont les bienvenues.',
    channel: 'La chaîne YouTube YoanDev',
    repo: 'Le code sur GitHub',
  },
  pricing: {
    title: 'Payez les images, pas un abonnement',
    subtitle: 'NanoThumbnail est gratuit. Vous réglez directement Replicate ou Google, au prix coûtant.',
    ours: {
      name: 'NanoThumbnail',
      price: 'Gratuit',
      unit: 'pour toujours',
      note: 'Vous payez seulement les images, au fournisseur : environ 0,07 $ (Nano Banana 2, 1K) à 0,15 $ (Nano Banana Pro).',
      features: ['Toutes les fonctionnalités', 'Votre clé Replicate ou Gemini', 'Aucune commission', 'Données locales'],
      cta: 'Commencer',
    },
    theirs: {
      name: 'Outils SaaS de miniatures',
      note: 'Ordre de grandeur des abonnements courants, à titre indicatif.',
      price: '20 à 90 $',
      unit: '/ mois',
      features: ['Abonnement récurrent', 'Crédits qui expirent', 'Images sur leurs serveurs', 'Modèle imposé'],
    },
  },
  faq: {
    title: 'Questions fréquentes',
    items: [
      {
        q: 'YouTube Studio génère déjà des miniatures. Pourquoi NanoThumbnail ?',
        a: 'L’assistant de YouTube Studio peut vous proposer une miniature. NanoThumbnail est un atelier dédié : retouche phrase par phrase qui garde le visage intact, retouche par zone, aperçu dans le fil avec les zones de sécurité, critique notée, 14 styles, vos visages et votre brand kit, et le choix du modèle. Les deux se complètent : vos meilleures variantes s’exportent vers «\u00a0Tester et comparer\u00a0».',
      },
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
        q: 'Faut-il une carte bancaire ?',
        a: 'Oui, chez le fournisseur : la génération d’images n’est pas incluse dans l’offre gratuite de l’API Gemini, il faut activer la facturation sur le projet Google de votre clé. Replicate facture aussi à l’usage. Comptez environ 0,07 à 0,15 $ par image.',
      },
      {
        q: 'Combien de temps pour une miniature ?',
        a: 'Une trentaine de secondes pour quatre variantes avec Nano Banana 2 en 1K, un peu plus avec Nano Banana Pro ou en 4K. Une retouche prend à peu près le même temps.',
      },
      {
        q: 'Ça marche sur mobile ?',
        a: 'Oui : le studio fonctionne sur téléphone et s’installe comme une app. Pour peindre une zone ou comparer des variantes, un écran plus grand reste plus confortable.',
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
    hero: 'Miniature YouTube générée avec NanoThumbnail : une créatrice stupéfaite montre un smartphone minuscule, une grosse flèche rouge pointe vers lui, texte jaune « MINI ?! »',
    studio: 'Capture du studio NanoThumbnail : brief à gauche, miniature au centre, historique des versions et retouches rapides à droite',
    steps: ['Version générée : texte « MINI ?! » sombre, sans flèche', 'Première retouche : une flèche rouge pointe vers le téléphone', 'Deuxième retouche : le texte passe en jaune vif avec un contour noir'],
    mask: 'Retouche par zone : le téléphone est peint en magenta pour être transformé',
    score: 'Panneau de score IA : note globale et six critères détaillés, notés sur 10',
    safezones: 'Zones de sécurité affichées sur la miniature : durée, icônes au survol, barre de progression',
    concepts: 'Assistant de concepts : trois propositions différentes pour la même vidéo',
    commands: 'Palette de commandes ⌘K',
    compare: 'Vue Comparer : trois variantes classées par l’IA avec leurs justifications',
    og: 'NanoThumbnail — des miniatures YouTube générées avec l’IA, dans tous les styles',
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
  nav: { features: 'Features', gallery: 'Gallery', pricing: 'Pricing', faq: 'FAQ', open: 'Open the studio', github: 'GitHub', switchLang: 'Français' },
  hero: {
    badge: 'Powered by Nano Banana Pro and Nano Banana 2',
    title: 'The perfect thumbnail,',
    titleAccent: 'one edit at a time.',
    subtitle:
      'Generate with Nano Banana, fix it in one sentence, check it in the YouTube feed, get an AI critique. The open-source studio that runs in your browser, with your own key.',
    cta: 'Open the studio — free',
    secondary: 'See how it works',
    trust: ['Free & open source', 'No sign-up with us', 'Your images stay with you'],
    chips: {
      score: 'AI score',
      scoreValue: 81,
      style: 'Style',
      styleValue: 'Reaction + object',
      edits: ['Add a red arrow pointing at the phone', 'Make the text bright yellow'],
      editDone: 'Edit applied',
      variants: '4 variants',
      model: 'Nano Banana 2',
    },
  },
  studio: {
    eyebrow: 'The studio',
    title: 'A thumbnail’s whole lifecycle, on one screen',
    subtitle: 'Brief on the left, image in the middle, iteration on the right. Every version is kept in the project filmstrip.',
  },
  gallery: {
    eyebrow: 'Gallery',
    title: 'A style for every niche',
    subtitle: 'Every one of these thumbnails was generated in NanoThumbnail from a few-line brief, using one of the 14 ready-made styles, sometimes followed by an edit or two.',
    note: 'Need a version in another language? One edit does it: “Replace the text with…”',
    titles: {
      reaction: 'I tested the world’s smallest smartphone',
      versus: 'Air fryer vs oven: which one actually wins?',
      'before-after': 'I renovated my living room for $3,000',
      tech: 'Learn Rust in 10 minutes',
      cinematic: 'The island’s last fisherman',
      minimal: 'I’ve woken up at 5 a.m. for a year',
      story: 'Lost alone in Iceland for 3 days',
      ranking: 'Top 5 electric cars under $30k',
      gaming: 'I beat the game without dying once',
      finance: 'Investing $100 a month for 20 years',
      vlog: '48 hours in Tokyo on $200',
      hyper: 'The biggest soda geyser ever made',
      clay: 'Homemade tacos: the real recipe',
      podcast: 'She quit everything at 50 to open a bakery',
    },
  },
  iterate: {
    eyebrow: 'Conversational edits',
    title: 'Stop re-rolling. Start editing.',
    subtitle: 'Describe what’s wrong in one sentence. The face, lighting and composition stay the same — only what you ask for changes.',
    steps: [
      { label: 'Generation', text: '“Reaction + object” style, text “MINI ?!”' },
      { label: 'Edit', text: '“Add a big red arrow pointing at the phone”' },
      { label: 'Edit', text: '“Make the text bright yellow with a black outline”' },
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
    yourTitle: 'I tested the world’s smallest smartphone',
    channel: 'Your channel',
    meta: '2 hours ago',
    others: [
      { channel: 'Code & Coffee', meta: '84K views · 3 days ago' },
      { channel: 'Smart Kitchen', meta: '1.2M views · 1 month ago' },
      { channel: 'Tech Deals Daily', meta: '312K views · 2 weeks ago' },
      { channel: 'Pixel Arena', meta: '2.4M views · 5 days ago' },
      { channel: 'Tiny Budget', meta: '97K views · 1 week ago' },
    ],
  },
  extras: {
    title: 'Built for speed',
    items: [
      { key: 'concepts', title: 'Concept assistant', text: 'Give it your title: three genuinely different angles, with brief, text and style, ready to generate.' },
      { key: 'commands', title: 'Keyboard-first', text: '⌘K palette, ⌘↵ to generate, F for feed preview, Z for safe zones, M for the mask.' },
    ],
  },
  bento: {
    title: 'Built for speed, with everything around it',
    items: {
      people: { title: 'Faithful faces', text: 'The same face from one image to the next. Up to 5 people per thumbnail, with their angles and expressions.' },
      brand: { title: 'Brand kit', text: 'Colours, type, logo, and a style profile distilled from your best thumbnails.' },
      text: { title: 'Crisp text or clean space', text: 'The AI writes the text, or leaves clean space for you to add it.' },
      local: { title: '100% local', text: 'Projects, versions and faces stay in your browser. One-click zip backup.' },
      pwa: { title: 'Installable', text: 'A real app, even offline to browse your library.' },
      keys: { title: 'Your key, your rules', text: 'Replicate or Gemini, remembered or just for the session.' },
    },
  },
  start: {
    eyebrow: 'Get started',
    title: 'Ready in 2 minutes',
    subtitle: 'NanoThumbnail runs on your own API key: you pay the provider directly for images, with no middleman.',
    steps: [
      { title: 'Create an API key', text: 'On Google AI Studio (Gemini) or on Replicate. A few clicks with your Google or GitHub account.' },
      { title: 'Paste it in the studio', text: 'It stays in your browser, remembered or just for the session.' },
      { title: 'Write a brief, generate', text: 'Four variants in about thirty seconds. Edit, compare, export.' },
    ],
    links: { gemini: 'Google AI Studio key', replicate: 'Replicate key' },
    cost: 'About $0.07 to $0.15 per image: 100 thumbnails cost $7 to $15.',
  },
  maker: {
    eyebrow: 'By a creator, for creators',
    title: 'Built by someone who publishes on YouTube too',
    text: 'NanoThumbnail is built by Yoan Bernabeu, a developer and the creator of the YoanDev YouTube channel, followed by more than 23,000 subscribers. The project is open source under the MIT license: the code is public, and ideas and contributions are welcome.',
    channel: 'The YoanDev YouTube channel',
    repo: 'The code on GitHub',
  },
  pricing: {
    title: 'Pay for images, not a subscription',
    subtitle: 'NanoThumbnail is free. You pay Replicate or Google directly, at cost.',
    ours: {
      name: 'NanoThumbnail',
      price: 'Free',
      unit: 'forever',
      note: 'You only pay for images, to the provider: about $0.07 (Nano Banana 2, 1K) to $0.15 (Nano Banana Pro).',
      features: ['Every feature', 'Your Replicate or Gemini key', 'No markup', 'Local data'],
      cta: 'Get started',
    },
    theirs: {
      name: 'SaaS thumbnail tools',
      note: 'Typical subscription range, for reference only.',
      price: '$20–90',
      unit: '/ month',
      features: ['Recurring subscription', 'Expiring credits', 'Images on their servers', 'Model chosen for you'],
    },
  },
  faq: {
    title: 'Frequently asked questions',
    items: [
      {
        q: 'YouTube Studio already generates thumbnails. Why NanoThumbnail?',
        a: 'YouTube Studio’s assistant can suggest a thumbnail. NanoThumbnail is a dedicated workshop: sentence-by-sentence edits that keep the face intact, area edits, feed preview with safe zones, a scored critique, 14 styles, your faces and brand kit, and your choice of model. The two work together: your best variants export straight to Test & Compare.',
      },
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
        q: 'Do I need a credit card?',
        a: 'Yes, with the provider: image generation isn’t part of the Gemini API free tier, so billing must be enabled on your key’s Google project. Replicate also bills per use. Expect about $0.07 to $0.15 per image.',
      },
      {
        q: 'How long does a thumbnail take?',
        a: 'About thirty seconds for four variants with Nano Banana 2 at 1K, a bit longer with Nano Banana Pro or at 4K. An edit takes roughly the same time.',
      },
      {
        q: 'Does it work on mobile?',
        a: 'Yes: the studio works on phones and installs like an app. For painting an area or comparing variants, a bigger screen is still more comfortable.',
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
    hero: 'YouTube thumbnail made with NanoThumbnail: an amazed creator shows a tiny smartphone, a big red arrow points at it, yellow text “MINI ?!”',
    studio: 'NanoThumbnail studio screenshot: brief on the left, thumbnail in the middle, version history and quick edits on the right',
    steps: ['Generated version: dark “MINI ?!” text, no arrow', 'First edit: a red arrow points at the phone', 'Second edit: the text turns bright yellow with a black outline'],
    mask: 'Area edit: the phone is painted in magenta to be transformed',
    score: 'AI score panel: overall score and six detailed criteria, each out of 10',
    safezones: 'Safe zones shown on the thumbnail: duration badge, hover icons, progress bar',
    concepts: 'Concept assistant: three different proposals for the same video',
    commands: '⌘K command palette',
    compare: 'Compare view: three variants ranked by the AI with their reasons',
    og: 'NanoThumbnail — AI-generated YouTube thumbnails in every style',
  },
  footer: { made: 'An open-source project by', legal: 'Legal notice', privacy: 'Privacy', terms: 'Terms' },
};

export const site: Record<SiteLang, Dict> = { fr, en };
