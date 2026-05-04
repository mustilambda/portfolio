export default async function handler(req, res) {
  // Only allow POST
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

  const prompt = `You are an SEO content strategist. Analyze this search query across three layers, then perform a SERP content brief.

Query: "${query.trim()}"

Respond ONLY in this exact JSON format with no extra text, no markdown, no code fences:
{
  "layer1": "Search Intent: (1-2 bullet points — what is the user literally asking for? What format/type of content do they expect?)",
  "layer2": "Immediate Intent: (1-2 bullet points — what outcome does the user want from consuming this content?)",
  "layer3": "Hidden Intent: (1-2 bullet points — what is the deeper desire, emotion, or end goal driving this search?)",
  "contentAngle": "Recommended angle that serves all 3 layers simultaneously — be specific, sharp, and name the angle clearly with an example headline.",
  "serpAnalysis": "MUST-COVER TOPICS [HIGH PRIORITY = appears in 3+ top results]:\\n• (list 4-6 must-cover subtopics or questions)\\n\\nPEOPLE ALSO ASK:\\n• (list 4-5 PAA questions relevant to this query)\\n\\nCONTENT GAPS (angles the top pages are missing):\\n• (list 2-3 specific gaps your article could own)\\n\\nSUGGESTED H2 OUTLINE:\\nH2: (heading)\\nH2: (heading)\\nH2: (heading)\\nH2: (heading)\\nH2: (heading)"
}`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500,
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const errData = await geminiRes.json().catch(() => ({}));
      console.error('Gemini API error:', errData);
      return res.status(502).json({ error: 'AI service error. Please try again.' });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Strip any markdown code fences if present
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('JSON parse failed:', cleaned);
      return res.status(502).json({ error: 'Failed to parse AI response. Please try again.' });
    }

    return res.status(200).json({
      layer1: parsed.layer1 || '',
      layer2: parsed.layer2 || '',
      layer3: parsed.layer3 || '',
      contentAngle: parsed.contentAngle || '',
      serpAnalysis: parsed.serpAnalysis || '',
    });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
