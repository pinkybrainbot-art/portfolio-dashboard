// Vercel Serverless Function: /api/analyze
// Calls OpenAI to analyze portfolio

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { holdings, totalValue, stocksValue, cryptoValue } = req.body;
    
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Build portfolio summary
    const topHoldings = (holdings || [])
      .sort((a, b) => (b.shares * b.price) - (a.shares * a.price))
      .slice(0, 8)
      .map(h => `${h.symbol}: $${Math.round(h.shares * h.price).toLocaleString()} (${h.type})`)
      .join('\n');

    const prompt = `You are a concise financial analyst. Give a 3-4 sentence quick market analysis focusing on how current conditions affect this portfolio.

Portfolio: $${totalValue?.toLocaleString() || 'N/A'} total
- Stocks: $${stocksValue?.toLocaleString() || 'N/A'}
- Crypto: $${cryptoValue?.toLocaleString() || 'N/A'}

Top Holdings:
${topHoldings}

Current context: Feb 2026, Trump tariffs causing volatility, tech/AI stocks correcting, crypto in pullback from recent highs.

Be direct and actionable. Focus on these specific holdings.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const analysis = data.choices?.[0]?.message?.content || 'Analysis unavailable';

    return res.status(200).json({ 
      analysis, 
      timestamp: new Date().toISOString() 
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
