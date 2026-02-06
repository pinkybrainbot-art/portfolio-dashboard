// Vercel Serverless Function: /api/recommend
// Uses Anthropic Claude for portfolio recommendations

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
    const { holdings, totalValue, stocksValue, cryptoValue, type } = req.body;
    
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Anthropic API key not configured. Add ANTHROPIC_API_KEY to Vercel environment variables.' });
    }

    // Build current holdings summary
    const holdingsSummary = (holdings || [])
      .sort((a, b) => (b.shares * b.price) - (a.shares * a.price))
      .map(h => `${h.symbol}: $${Math.round(h.shares * h.price).toLocaleString()} (${((h.shares * h.price / totalValue) * 100).toFixed(1)}%) - ${h.type}`)
      .join('\n');

    let prompt;
    
    if (type === 'highRisk') {
      prompt = `You are an expert stock analyst specializing in high-conviction, short-term trading opportunities.

Current Portfolio ($${totalValue?.toLocaleString()}):
${holdingsSummary}

Current Market Context (Feb 2026):
- Trump tariffs creating sector volatility
- Tech/AI stocks under pressure but showing signs of bottoming
- Crypto in pullback mode
- Earnings season underway

Provide 3-4 HIGH RISK/HIGH REWARD stock ideas for the short-term (1-4 weeks). These should be:
- NOT already in the portfolio
- Have clear catalysts coming up
- Offer asymmetric risk/reward (potential 15-30%+ upside)
- Include specific entry points and stop losses

Format with these sections:
**🎯 High Risk/Reward Picks:**

For each pick:
- **[TICKER]** - Company Name
- Why: [1-2 sentence thesis]
- Catalyst: [specific upcoming event]
- Entry: $XX | Target: $XX | Stop: $XX
- Risk level: [High/Very High]

**⚠️ Key Risks:**
Brief note on what could go wrong with these plays.

Be specific with price levels. These are trading ideas, not long-term investments.`;
    } else {
      // rebalance type
      prompt = `You are an expert portfolio manager providing rebalancing recommendations.

Current Portfolio ($${totalValue?.toLocaleString()}):
${holdingsSummary}

Current Market Context (Feb 2026):
- Trump tariffs creating sector volatility
- Tech/AI stocks under pressure
- Crypto in pullback mode
- Fed holding rates steady

Analyze this portfolio and provide specific rebalancing recommendations:

Format with these sections:

**📉 Consider Reducing/Selling:**
Which current holdings should be trimmed or sold? Why? Be specific about position sizing.

**📈 Consider Adding Exposure:**
Which current holdings deserve MORE capital? Or what NEW positions should be added? Why?

**⚖️ Optimal Allocation:**
Suggest target allocation percentages for the top holdings.

**🎯 Priority Actions:**
List 2-3 specific trades to make this week, in order of priority.

Be direct and specific. Reference actual position sizes and suggest specific percentage changes.`;
    }

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

    const analysis = data.content?.[0]?.text || 'Analysis unavailable';

    return res.status(200).json({ 
      analysis, 
      timestamp: new Date().toISOString() 
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
