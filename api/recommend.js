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
    let maxTokens = 1200;
    
    if (type === 'watchlist') {
      const { watchlist } = req.body;
      maxTokens = 1500;
      
      const watchlistSummary = (watchlist || [])
        .map(w => `${w.symbol}: ${w.notes || 'No notes'} (Target: ${w.target ? '$' + w.target : 'Not set'})`)
        .join('\n');
      
      prompt = `You are an expert portfolio analyst. Analyze whether any stocks on the watchlist should be purchased TODAY to improve this portfolio.

CURRENT PORTFOLIO ($${totalValue?.toLocaleString()}):
${holdingsSummary}

WATCHLIST:
${watchlistSummary}

Current market context (Feb 2026): Trump tariffs, tech volatility, crypto pullback.

Analyze each watchlist stock and answer:

**🎯 Buy Recommendations**

For each watchlist stock, provide:
- **[SYMBOL]**: BUY TODAY / WAIT / PASS
- Reasoning (1-2 sentences)
- If BUY: suggested position size (% of portfolio or $ amount)
- If WAIT: what trigger/price to watch for

**⚖️ Portfolio Fit Analysis**
- Which watchlist stock would best complement the current holdings?
- Would any add unwanted concentration or correlation?

**🏆 Top Pick**
If you had to buy ONE stock from this watchlist today, which would it be and why?

Be decisive. Give clear buy/wait/pass recommendations, not wishy-washy analysis.`;
    } else if (type === 'conviction') {
      maxTokens = 2500;
      prompt = `You are an elite stock picker with a track record of identifying multi-bagger opportunities.

Based on current macro conditions, market positioning, and fundamental analysis, provide your HIGHEST CONVICTION stock picks for the best returns.

For each time horizon, list exactly 5 stocks ranked from #1 (highest conviction) to #5.

**🔥 1-YEAR HIGH CONVICTION PICKS (2026-2027)**

| Rank | Ticker | Company | Why It's #1-5 | Target Return |
|------|--------|---------|---------------|---------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

For each pick, briefly explain:
- The catalyst that will drive returns
- Key risk to the thesis

**🚀 3-YEAR HIGH CONVICTION PICKS (2026-2029)**

| Rank | Ticker | Company | Why It's #1-5 | Target Return |
|------|--------|---------|---------------|---------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

For each pick, briefly explain:
- The structural trend it captures
- What would invalidate the thesis

**💎 5-YEAR HIGH CONVICTION PICKS (2026-2031)**

| Rank | Ticker | Company | Why It's #1-5 | Target Return |
|------|--------|---------|---------------|---------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

For each pick, briefly explain:
- The mega-trend or transformation thesis
- Why this company wins vs competitors

**⚡ CONVICTION SUMMARY**
- Highest conviction single pick across all timeframes
- One pick that appears in multiple timeframes (compounding conviction)
- The contrarian pick that most people would dismiss

Be specific with target returns (e.g., "150-200% upside"). Focus on asymmetric risk/reward. These should be actionable, not generic.`;
    } else if (type === 'framework') {
      maxTokens = 4000;
      prompt = `You are a world-class macro strategist and portfolio architect. Assume I have no predefined asset, sector, or thesis.

Generate investment recommendations for the next 1, 3, and 5 years.

**PART 1: MACRO REGIME ANALYSIS**

First, outline the most plausible macro regimes for each horizon:
- **1-Year Outlook (2026-2027):** What's the base case? Key uncertainties?
- **3-Year Outlook (2026-2029):** What structural shifts are likely? Where is uncertainty highest?
- **5-Year Outlook (2026-2031):** What mega-trends dominate? What could derail them?

**PART 2: INVESTMENT BUCKETS BY HORIZON**

For EACH time horizon (1yr, 3yr, 5yr):

Define 3-5 investment buckets based on return drivers. For each bucket:
- **Bucket Name & Theme**
- **Why it could outperform** (bull case)
- **The bear case** (argue against it)
- **Invalidation triggers** (what would kill this thesis?)
- **Example assets** (specific tickers, sectors, or instruments)

**PART 3: RISK-ADJUSTED ALLOCATIONS**

Show how different risk profiles should allocate across these buckets:

| Bucket | Conservative | Moderate | Aggressive |
|--------|--------------|----------|------------|
| ...    | X%           | X%       | X%         |

**PART 4: KEY WATCHPOINTS**

List 5-7 specific indicators or events to monitor that would signal regime change or require rebalancing.

Be specific, contrarian where appropriate, and actionable. This should be institutional-quality analysis.`;
    } else if (type === 'highRisk') {
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
        max_tokens: maxTokens,
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
