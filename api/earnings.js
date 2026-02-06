// Vercel Serverless Function: /api/earnings
// Fetches earnings dates from Yahoo Finance

export default async function handler(req, res) {
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
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({ error: 'symbols array required' });
    }

    const earnings = {};

    for (const symbol of symbols) {
      try {
        const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=calendarEvents`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.ok) {
          const json = await response.json();
          const calendarEvents = json?.quoteSummary?.result?.[0]?.calendarEvents?.earnings;
          
          if (calendarEvents?.earningsDate?.[0]?.raw) {
            const timestamp = calendarEvents.earningsDate[0].raw * 1000;
            earnings[symbol] = {
              date: new Date(timestamp).toISOString().split('T')[0],
              time: calendarEvents.earningsCallTime || 'TBD'
            };
          }
        }
      } catch (e) {
        console.log(`Could not fetch earnings for ${symbol}:`, e.message);
      }
    }

    return res.status(200).json({ earnings });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
