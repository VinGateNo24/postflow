export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'Clé API manquante' });

  const { topic, tone, language, hashtagCount, includeEmojis, postStyle, targetAudience } = req.body;

  const toneMap = {
    inspiring: 'inspirant et motivant',
    funny: 'drôle et décalé',
    professional: 'professionnel et expert',
    storytelling: 'narratif (storytelling)',
    educational: 'éducatif et informatif',
    provocateur: 'provocateur et accrocheur'
  };

  const styleMap = {
    hook: 'Commence par un hook puissant sur la 1ère ligne (moins de 8 mots, intrigant)',
    question: 'Commence par une question percutante qui interpelle directement le lecteur',
    stat: 'Commence par une statistique ou un chiffre surprenant',
    story: 'Commence par une micro-histoire personnelle de 1-2 lignes'
  };

  const langMap = {
    fr: 'français',
    en: 'anglais',
    es: 'espagnol',
    de: 'allemand'
  };

  const emojiInstruction = includeEmojis
    ? 'Ajoute des emojis pertinents dans le texte pour le dynamiser.'
    : 'N\'utilise PAS d\'emojis dans le texte (sauf dans les hashtags si pertinent).';

  const prompt = `Tu es un expert en marketing Instagram et copywriting viral.

Génère un post Instagram optimisé avec ces paramètres :
- Sujet : ${topic}
- Ton : ${toneMap[tone] || tone}
- Audience cible : ${targetAudience || 'grand public'}
- Langue : ${langMap[language] || language}
- Style d'accroche : ${styleMap[postStyle] || styleMap.hook}
- Emojis : ${emojiInstruction}
- Hashtags : exactement ${hashtagCount} hashtags pertinents et populaires

Structure du post :
1. ACCROCHE (1-2 lignes max, ultra percutante selon le style demandé)
2. CORPS (3-6 lignes développant le sujet avec de la valeur)
3. CALL TO ACTION (1 ligne engageante — question, invitation à commenter, etc.)
4. HASHTAGS (${hashtagCount} hashtags séparés par des espaces, mélange populaires et de niche)

Réponds UNIQUEMENT avec le post Instagram complet, prêt à copier-coller. Pas d'explication, pas de titre, pas de balises Markdown.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Erreur API Claude'
      });
    }

    return res.status(200).json({ content: data.content[0].text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
