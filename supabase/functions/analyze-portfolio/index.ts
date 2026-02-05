// Supabase Edge Function: analyze-portfolio
// Calls OpenAI to analyze portfolio and returns response directly

import "https://deno.land/x/xhr@0.3.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { holdings, totalValue, stocksValue, cryptoValue } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Build portfolio summary for the prompt
    const topHoldings = holdings
      .sort((a: any, b: any) => (b.shares * b.price) - (a.shares * a.price))
      .slice(0, 8)
      .map((h: any) => `${h.symbol}: $${(h.shares * h.price).toLocaleString()} (${h.type})`)
      .join('\n');

    const prompt = `You are a concise financial analyst. Give a 3-4 sentence quick market analysis focusing on how current conditions affect this portfolio.

Portfolio: $${totalValue?.toLocaleString() || 'N/A'} total
- Stocks: $${stocksValue?.toLocaleString() || 'N/A'}
- Crypto: $${cryptoValue?.toLocaleString() || 'N/A'}

Top Holdings:
${topHoldings}

Current market context: Feb 2026, Trump tariffs causing volatility, tech/AI stocks under pressure, crypto in correction.

Be direct, no fluff. Focus on actionable insights for these specific holdings.`;

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
    const analysis = data.choices?.[0]?.message?.content || 'Analysis unavailable';

    return new Response(
      JSON.stringify({ analysis, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
