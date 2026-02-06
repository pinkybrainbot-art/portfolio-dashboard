// Vercel Serverless Function: /api/analyze
// Supports both OpenAI and Anthropic for portfolio analysis

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
    const { holdings, totalValue, stocksValue, cryptoValue, model = 'anthropic' } = req.body;
    
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    
    // Check for required API key based on model selection
    if (model === 'openai' && !OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    if (model === 'anthropic' && !ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Anthropic API key not configured' });
    }

    // Build portfolio summary - top 5 holdings only
    const topHoldings = (holdings || [])
      .sort((a, b) => (b.shares * b.price) - (a.shares * a.price))
      .slice(0, 5)
      .map(h => `${h.symbol}: $${Math.round(h.shares * h.price).toLocaleString()} (${h.type})`)
      .join('\n');

    const prompt = `You are a sharp financial analyst. Analyze these TOP 5 HOLDINGS with a structured breakdown.

Portfolio: $${totalValue?.toLocaleString() || 'N/A'} total
- Stocks: $${stocksValue?.toLocaleString() || 'N/A'}  
- Crypto: $${cryptoValue?.toLocaleString() || 'N/A'}

TOP 5 Holdings:
${topHoldings}

Current context (Feb 2026): Trump tariffs, tech/AI under pressure, crypto pullback, Fed holding rates.

Provide analysis using EXACTLY these 6 sections (keep each section to 2-3 bullet points max):

**📊 1. What's Currently Moving the Price?**
What macro/micro factors are driving these specific holdings right now?

**📰 2. What Recent News Has Already Broken?**
Key news in the past week affecting these holdings.

**📅 3. What Short-Term Catalysts Are on the Horizon?**
Upcoming earnings, events, announcements in the next 2 weeks.

**📈 4. What Technical or Quant Signals Are Relevant?**
Key support/resistance levels, momentum, volume signals.

**🧠 5. How Is the Market Positioning?**
Institutional flows, sentiment, crowded trades.

**🎯 6. What Are the Risks That AI Might Be Missing?**
Contrarian view, blind spots, non-obvious risks.

Be specific to these 5 holdings. Use bullet points within each section.`;

    let analysis;

    if (model === 'anthropic') {
      // Use Anthropic Claude
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1200,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        return res.status(500).json({ error: data.error.message });
      }

      analysis = data.content?.[0]?.text || 'Analysis unavailable';
    } else {
      // Use OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1200,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        return res.status(500).json({ error: data.error.message });
      }

      analysis = data.choices?.[0]?.message?.content || 'Analysis unavailable';
    }

    return res.status(200).json({ 
      analysis, 
      timestamp: new Date().toISOString(),
      model: model === 'anthropic' ? 'Claude' : 'GPT-4o'
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
