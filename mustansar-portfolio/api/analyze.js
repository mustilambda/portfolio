export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const prompt = `You are an SEO strategist. Analyze this search query and respond ONLY with a valid JSON object. No markdown, no code fences, no explanation — just the raw JSON.

Query: "${query.trim()}"

Return exactly this JSON structure with string values only:
{
  "layer1": "Search Intent: • point one • point two",
  "layer2": "Immediate Intent: • point one • point two",
  "layer3": "Hidden Intent: • point one • point two",
  "contentAngle": "Your recommended content angle and example headline",
  "serpAnalysis": "MUST-COVER TOPICS:\\n• topic 1\\n• topic 2\\n• topic 3\\n• topic 4\\n\\nPEOPLE ALSO ASK:\\n• question 1\\n• question 2\\n• question 3\\n\\nCONTENT GAPS:\\n• gap 1\\n• gap 2\\n\\nSUGGESTED H2 OUTLINE:\\nH2: heading 1\\nH2: heading 2\\nH2: heading 3\\nH2: heading 4\\nH2: heading 5"
}`;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an SEO strategist. Always respond with valid JSON only. No markdown, no code fences, no extra text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      })
    });

    if (!groqRes.ok) {
      const errData = await groqRes.json().catch(() => ({}));
      console.error('Groq API error:', JSON.stringify(errData));
      return res.status(502).json({ error: `API error ${groqRes.status}: ${errData?.error?.message || 'Unknown'}` });
    }

    const groqData = await groqRes.json();
    const rawText = groqData?.choices?.[0]?.message?.content || '';

    // Clean and extract JSON
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

    // Handle both string and array responses
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
