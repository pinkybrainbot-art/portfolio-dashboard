-- Seed data for Portfolio Dashboard
-- Run this AFTER supabase-schema.sql

-- Holdings
INSERT INTO holdings (symbol, name, shares, type) VALUES
  ('TSLA', 'Tesla', 215.31, 'stock'),
  ('CARR', 'Carrier Global', 193.24, 'stock'),
  ('ANET', 'Arista Networks', 77.07, 'stock'),
  ('NVDA', 'NVIDIA', 38.57, 'stock'),
  ('FTNT', 'Fortinet', 84.44, 'stock'),
  ('MRVL', 'Marvell Technology', 83.81, 'stock'),
  ('SNOW', 'Snowflake', 48.14, 'stock'),
  ('HIMS', 'Hims & Hers Health', 545.40, 'stock'),
  ('MSTR', 'MicroStrategy', 153.45, 'stock'),
  ('BTC', 'Bitcoin', 1, 'crypto'),
  ('SOL', 'Solana', 121, 'crypto')
ON CONFLICT (symbol) DO UPDATE SET shares = EXCLUDED.shares, name = EXCLUDED.name;

-- Current prices (update these regularly)
INSERT INTO prices (symbol, price) VALUES
  ('TSLA', 418),
  ('CARR', 68.94),
  ('ANET', 115.60),
  ('NVDA', 116.66),
  ('FTNT', 103.74),
  ('MRVL', 106.78),
  ('SNOW', 186.26),
  ('HIMS', 54.37),
  ('MSTR', 338.78),
  ('BTC', 97762),
  ('SOL', 189.34)
ON CONFLICT (symbol) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

-- Weekly snapshots
INSERT INTO snapshots (date, total_value, stocks_value, crypto_value, cash) VALUES
  ('2026-01-06', 295000, 180000, 70000, 45000),
  ('2026-01-13', 302000, 185000, 72000, 45000),
  ('2026-01-20', 298000, 182000, 71000, 45000),
  ('2026-01-27', 314000, 190000, 79000, 45000),
  ('2026-02-02', 311260, 177771, 88489, 45000)
ON CONFLICT (date) DO UPDATE SET total_value = EXCLUDED.total_value;

-- Theses
INSERT INTO theses (symbol, thesis, conviction, target_price) VALUES
  ('TSLA', 'Robotaxi and humanoid robots not priced in. Full autonomy could 10x revenue. Optimus humanoid is massive TAM.', 'high', 1000),
  ('NVDA', 'AI infrastructure backbone. Every major company needs their chips. Moat is deep.', 'high', 200),
  ('HIMS', 'DTC healthcare disruption. Growing revenue 50%+ YoY. GLP-1s are huge catalyst.', 'medium', 80);

-- Watchlist
INSERT INTO watchlist (symbol, notes, target_entry) VALUES
  ('CRWV', 'AI infrastructure play. High risk/reward. Watch for entry.', 35),
  ('RKLB', 'Space optionality. Rocket Lab has real customers.', 20),
  ('MU', 'Best value in semis. Memory cycle turning.', 90)
ON CONFLICT (symbol) DO NOTHING;

-- Recent transactions
INSERT INTO transactions (symbol, action, shares, price, date, notes) VALUES
  ('TSLA', 'buy', 30, 418, '2026-02-02', 'Good entry on dip'),
  ('SUI', 'sell', 2500, 4.20, '2026-01-30', 'Taking profits, crypto bearish'),
  ('IONQ', 'sell', 150, 42.50, '2026-01-28', 'Quantum hype overblown'),
  ('LMT', 'sell', 45, 485.00, '2026-01-25', 'Taking profits');

-- Notes
INSERT INTO notes (author, content, tags) VALUES
  ('pinky', 'Portfolio repositioning complete. Sold speculative positions and holding $45k cash for high-conviction entries.', ARRAY['strategy']),
  ('pinky', 'Crypto in bear mode — BTC dominance rising. Keeping core BTC + SOL positions. Patience over FOMO.', ARRAY['crypto', 'macro']),
  ('chris', 'Want long term holds that can realistically 3X. Looking for undervalued plays.', ARRAY['strategy']);

-- Macro indicators
INSERT INTO macro_indicators (id, name, value, trend) VALUES
  ('vix', 'VIX', '18.2', 'up'),
  ('dxy', 'DXY', '108.4', 'up'),
  ('btc-dom', 'BTC Dominance', '58.2%', 'up'),
  ('10y', '10Y Treasury', '4.52%', 'up'),
  ('fear-greed', 'Fear & Greed', '44', 'down'),
  ('m2', 'M2 YoY', '+3.2%', 'up'),
  ('spx', 'S&P 500', '6,040', 'neutral'),
  ('btc-liq', 'BTC Liq Levels', '$92k / $104k', 'neutral')
ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, trend = EXCLUDED.trend, updated_at = NOW();

-- Cash setting
INSERT INTO settings (key, value) VALUES ('cash', '32460')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
