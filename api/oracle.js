export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://oraculo-amber.vercel.app',
        'X-Title': 'Oraculo Senora Incertidumbre',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenRouter error:', response.status, err);
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      console.error('Unexpected response:', JSON.stringify(data));
      return res.status(500).json({ error: 'No choices in response' });
    }

    const raw = data.choices[0].message.content || '';
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr.message, '\nRaw:', clean.slice(0, 300));
      return res.status(500).json({ error: 'JSON parse failed', raw: clean.slice(0, 300) });
    }

    return res.status(200).json(parsed);

  } catch (e) {
    console.error('Handler error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
