export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const systemPrompt = `You are a senior SEO content strategist with 10+ years of experience analyzing search intent, SERP patterns, and content architecture. You think like an editor AND a marketer — sharp, specific, no filler.

You MUST respond with a valid JSON object only. No markdown, no code fences, no preamble, no explanation. Just raw JSON.`;

  const userPrompt = `Analyze this search query for a content team and return a detailed JSON object.

Query: "${query.trim()}"

Return EXACTLY this JSON structure. All values must be strings:

{
  "layer1": "Two sharp bullet points starting with • that describe the literal search intent. What format does the SERP likely reward? What type of result is the user expecting?",
  "layer2": "Two sharp bullet points starting with • that describe the immediate intent. What outcome does the user want from consuming this content? What do they want to walk away with?",
  "layer3": "Two sharp bullet points starting with • that reveal the hidden emotional or aspirational driver. What is the user REALLY trying to solve, achieve, or feel? Go deeper than the surface.",
  "contentAngle": "A bold, specific content angle (2-3 sentences) that satisfies all three intent layers simultaneously. Include a suggested article headline that would stand out on the SERP.",
  "mustCoverTopics": "• [HIGH PRIORITY] Topic one — why it matters\\n• [HIGH PRIORITY] Topic two — why it matters\\n• [HIGH PRIORITY] Topic three — why it matters\\n• Topic four — brief note\\n• Topic five — brief note\\n• Topic six — brief note\\n• Topic seven — brief note\\n• Topic eight — brief note",
  "peopleAlsoAsk": "• Question one that real users ask around this topic?\\n• Question two?\\n• Question three?\\n• Question four?\\n• Question five?\\n• Question six?",
  "contentGaps": "• Gap one — specific angle or subtopic top-ranking pages skip, and why owning it helps you rank\\n• Gap two — same format\\n• Gap three — same format\\n• Gap four — same format",
  "h2Outline": "H2: Compelling heading one\\nH2: Compelling heading two\\nH2: Compelling heading three\\nH2: Compelling heading four\\nH2: Compelling heading five\\nH2: Compelling heading six\\nH2: Compelling heading seven"
}

Rules:
- Every bullet point must be specific to THIS query — nothing generic
- [HIGH PRIORITY] flags go on topics that appear across 3+ top-ranking pages
- H2s must be compelling and specific, not generic section labels
- Content gaps must name what is missing AND why it is an opportunity
- Return ONLY the JSON. Nothing else.`;

  try {
    const apiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://mustansarmahmood.com',
        'X-Title': 'SEO Intent Analyzer'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-lite-001',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6,
        max_tokens: 2000
      })
    });

    if (!apiRes.ok) {
      const errData = await apiRes.json().catch(() => ({}));
      console.error('OpenRouter API error:', JSON.stringify(errData));
      return res.status(502).json({ error: `API error ${apiRes.status}: ${errData?.error?.message || 'Unknown'}` });
    }

    const apiData = await apiRes.json();
    const rawText = apiData?.choices?.[0]?.message?.content || '';

    // Strip markdown fences if model adds them
    let cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('JSON parse failed. Raw:', rawText);
      return res.status(502).json({ error: 'Failed to parse AI response. Please try again.' });
    }

    const toString = (val) => {
      if (!val) return '';
      if (Array.isArray(val)) return val.join('\n');
      return String(val);
    };

    return res.status(200).json({
      layer1: toString(parsed.layer1),
      layer2: toString(parsed.layer2),
      layer3: toString(parsed.layer3),
      contentAngle: toString(parsed.contentAngle),
      mustCoverTopics: toString(parsed.mustCoverTopics),
      peopleAlsoAsk: toString(parsed.peopleAlsoAsk),
      contentGaps: toString(parsed.contentGaps),
      h2Outline: toString(parsed.h2Outline),
    });

  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
