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

  const prompt = `You are an SEO strategist. Analyze this query and respond ONLY in valid JSON with no markdown, no code fences, no extra text before or after the JSON.

Query: "${query.trim()}"

Return this exact JSON structure:
{
  "layer1": "Search Intent: 2 bullet points on what the user literally wants and what content format they expect",
  "layer2": "Immediate Intent: 2 bullet points on what outcome the user wants from reading this content",
  "layer3": "Hidden Intent: 2 bullet points on the deeper emotion or end goal driving this search",
  "contentAngle": "One sharp content angle serving all 3 layers with an example headline",
  "serpAnalysis": "MUST-COVER TOPICS:\\n• topic 1\\n• topic 2\\n• topic 3\\n• topic 4\\n\\nPEOPLE ALSO ASK:\\n• question 1\\n• question 2\\n• question 3\\n\\nCONTENT GAPS:\\n• gap 1\\n• gap 2\\n\\nSUGGESTED H2 OUTLINE:\\nH2: heading\\nH2: heading\\nH2: heading\\nH2: heading\\nH2: heading"
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
            temperature: 0.5,
            maxOutputTokens: 800,
            responseMimeType: "application/json",
            thinkingConfig: {
              thinkingBudget: 0
            }
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const errData = await geminiRes.json().catch(() => ({}));
      console.error('Gemini API error:', JSON.stringify(errData));
      return res.status(502).json({ error: `Gemini error ${geminiRes.status}: ${errData?.error?.message || 'Unknown'}` });
    }

    const geminiData = await geminiRes.json();
    console.log('Full Gemini response:', JSON.stringify(geminiData));

    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('Raw text:', rawText);

    // Aggressively clean the response
    let cleaned = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    // Extract JSON object if surrounded by extra text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('JSON parse failed. Raw:', rawText);
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
    console.error('Handler error:', err.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
