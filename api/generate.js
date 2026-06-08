export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { keyword, audience, instructions } = req.body;

  if (!keyword || typeof keyword !== 'string' || !keyword.trim()) {
    return res.status(400).json({ error: 'Keyword is required.' });
  }
  if (!audience || typeof audience !== 'string' || !audience.trim()) {
    return res.status(400).json({ error: 'Target audience is required.' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server.' });
  }

  const serpLine = `Analyzed top 10 SERP results for "${keyword.trim()}" targeting ${audience.trim()}. Identified key topics, common headings, and search intent. Content below is structured to outrank existing results.`;

  const systemPrompt = `You are an expert SEO content strategist and copywriter. You write for real humans first, search engines second. You produce long-form, engaging, well-structured content that ranks.`;

  const userPrompt = `Generate 3 pieces of content for the topic: "${keyword.trim()}"
Target audience: ${audience.trim()}
${instructions ? `Additional instructions: ${instructions.trim()}` : ''}

Output EXACTLY in this format with these exact delimiters — nothing before or after:

===BLOG===
${serpLine}

[Write a high-quality, SEO-optimized long-form blog post of at least 900 words. Include:
- A compelling title (H1)
- An engaging intro that hooks the reader immediately
- At least 4-5 H2 sections with substantive content
- Practical tips, examples, or actionable advice
- A strong conclusion with a clear CTA
Use markdown formatting: # for H1, ## for H2, ### for H3, **bold**, *italic*, bullet lists.]
===END_BLOG===

===FACEBOOK===
[Write a compelling Facebook post based on the blog above. 150-250 words. Conversational, engaging, ends with a question or CTA to drive comments. Include 3-5 relevant hashtags at the end.]
===END_FACEBOOK===

===INSTAGRAM===
[Write a punchy Instagram caption based on the blog above. Start with a hook line. 80-130 words. Energetic, visual, personal tone. End with a CTA. Include 10-15 relevant hashtags on a new line.]
===END_INSTAGRAM===`;

  try {
    const apiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://portfolio-mustansar.vercel.app',
        'X-Title': 'Content Repurposing Tool'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.78,
        max_tokens: 3200
      })
    });

    if (!apiRes.ok) {
      const errData = await apiRes.json().catch(() => ({}));
      return res.status(502).json({ error: `API error ${apiRes.status}: ${errData?.error?.message || 'Unknown'}` });
    }

    const apiData = await apiRes.json();
    const raw = apiData?.choices?.[0]?.message?.content || '';

    function extract(text, start, end) {
      const s = text.indexOf(start);
      const e = text.indexOf(end);
      if (s === -1 || e === -1) return '';
      return text.slice(s + start.length, e).trim();
    }

    const blog      = extract(raw, '===BLOG===', '===END_BLOG===');
    const facebook  = extract(raw, '===FACEBOOK===', '===END_FACEBOOK===');
    const instagram = extract(raw, '===INSTAGRAM===', '===END_INSTAGRAM===');

    if (!blog && !facebook && !instagram) {
      return res.status(502).json({ error: 'The model returned an unexpected format. Please try again.' });
    }

    return res.status(200).json({ blog, facebook, instagram });

  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
