// Vercel Serverless Function: /api/earnings
// Returns known earnings dates (manually maintained for reliability)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Known earnings dates (update periodically)
  // Source: Check earnings calendars like earningswhispers.com, nasdaq.com
  const knownEarnings = {
    'TSLA': { date: '2026-04-22', time: 'AMC' },
    'NVDA': { date: '2026-02-26', time: 'AMC' },
    'MSTR': { date: '2026-02-05', time: 'AMC' },
    'HIMS': { date: '2026-02-24', time: 'BMO' },
    'ANET': { date: '2026-02-17', time: 'AMC' },
    'SNOW': { date: '2026-02-26', time: 'AMC' },
    'FTNT': { date: '2026-02-06', time: 'AMC' },
    'MRVL': { date: '2026-03-06', time: 'AMC' },
  };

  try {
    const { symbols } = req.body || {};
    
    const earnings = {};
    
    if (symbols && Array.isArray(symbols)) {
      for (const symbol of symbols) {
        if (knownEarnings[symbol]) {
          earnings[symbol] = knownEarnings[symbol];
        }
      }
    } else {
      // Return all known earnings
      Object.assign(earnings, knownEarnings);
    }

    return res.status(200).json({ 
      earnings,
      lastUpdated: '2026-02-07',
      note: 'Dates are estimates. AMC=After Market Close, BMO=Before Market Open'
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
