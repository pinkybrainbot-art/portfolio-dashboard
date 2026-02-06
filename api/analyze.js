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

    // Build portfolio summary - top 5 holdings only
    const topHoldings = (holdings || [])
      .sort((a, b) => (b.shares * b.price) - (a.shares * a.price))
      .slice(0, 5)
      .map(h => `${h.symbol}: $${Math.round(h.shares * h.price).toLocaleString()} (${h.type})`)
      .join('\n');

    const prompt = `You are a concise financial analyst. Analyze these TOP 5 HOLDINGS and provide a structured analysis.

Portfolio: $${totalValue?.toLocaleString() || 'N/A'} total
- Stocks: $${stocksValue?.toLocaleString() || 'N/A'}
- Crypto: $${cryptoValue?.toLocaleString() || 'N/A'}

TOP 5 Holdings:
${topHoldings}

Current market context (Feb 2026):
- Trump tariffs causing market volatility
- Tech/AI stocks under pressure
- Crypto in pullback mode
- Fed holding rates steady

Format your response EXACTLY like this (use the headers):

**📊 Week Review:**
Brief 2-3 sentence summary of how these holdings performed this past week.

**⚠️ Current Factors:**
List 2-3 specific current events/factors impacting these holdings right now (tariffs, regulatory news, sector rotation, etc.)

**📅 Upcoming Events:**
List any known upcoming catalysts for these specific holdings (earnings dates, product launches, Fed meetings, etc.) in the next 2 weeks.

**🎯 Short-term Outlook:**
1-2 sentence outlook for the next 1-2 weeks.

**💡 Recommendation:**
One specific, actionable recommendation.

Be concise but comprehensive. Focus specifically on these 5 holdings.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
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
