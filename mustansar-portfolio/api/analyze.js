export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const prompt = `You are an SEO strategist. Analyze this search query.

Query: "${query.trim()}"

Respond in JSON. Every value must be a plain string, not an array.

{
  "layer1": "Search Intent: bullet 1 here. bullet 2 here.",
  "layer2": "Immediate Intent: bullet 1 here. bullet 2 here.",
  "layer3": "Hidden Intent: bullet 1 here. bullet 2 here.",
  "contentAngle": "Your recommended content angle and example headline here.",
  "serpAnalysis": "MUST-COVER TOPICS:\\n• topic 1\\n• topic 2\\n• topic 3\\n\\nPEOPLE ALSO ASK:\\n• question 1\\n• question 2\\n• question 3\\n\\nCONTENT GAPS:\\n• gap 1\\n• gap 2\\n\\nSUGGESTED H2 OUTLINE:\\nH2: heading 1\\nH2: heading 2\\nH2: heading 3\\nH2: heading 4"
}`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1000,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 }
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const errData = await geminiRes.json().catch(() => ({}));
      return res.status(502).json({ error: `Gemini error ${geminiRes.status}: ${errData?.error?.message || 'Unknown'}` });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Clean response
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

    // Helper: convert array or string to a single string
    const toString = (val) => {
      if (!val) return '';
      if (Array.isArray(val)) return val.join('\n• ');
      return String(val);
    };

    return res.status(200).json({
      layer1: toString(parsed.layer1),
      layer2: toString(parsed.layer2),
      layer3: toString(parsed.layer3),
      contentAngle: toString(parsed.contentAngle),
      serpAnalysis: toString(parsed.serpAnalysis),
    });

  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
