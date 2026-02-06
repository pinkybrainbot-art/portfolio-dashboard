-- Portfolio Dashboard Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Holdings table
CREATE TABLE holdings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  shares DECIMAL(18,8) NOT NULL,
  avg_cost DECIMAL(18,2),
  type TEXT NOT NULL CHECK (type IN ('stock', 'crypto')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Current prices (updated by Pinky)
CREATE TABLE prices (
  symbol TEXT PRIMARY KEY,
  price DECIMAL(18,2) NOT NULL,
  change_24h DECIMAL(8,2),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction log
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('buy', 'sell')),
  shares DECIMAL(18,8) NOT NULL,
  price DECIMAL(18,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly portfolio snapshots (for chart)
CREATE TABLE snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_value DECIMAL(18,2) NOT NULL,
  stocks_value DECIMAL(18,2),
  crypto_value DECIMAL(18,2),
  cash DECIMAL(18,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investment theses
CREATE TABLE theses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  thesis TEXT NOT NULL,
  conviction TEXT CHECK (conviction IN ('high', 'medium', 'low')),
  target_price DECIMAL(18,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watchlist
CREATE TABLE watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT,
  notes TEXT,
  target_entry DECIMAL(18,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes (Pinky's thoughts + Chris's notes)
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author TEXT NOT NULL CHECK (author IN ('pinky', 'chris')),
  content TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Macro indicators
CREATE TABLE macro_indicators (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  trend TEXT CHECK (trend IN ('up', 'down', 'neutral')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings (cash balance, preferences)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize cash setting
INSERT INTO settings (key, value) VALUES ('cash', '45000');

-- Row Level Security (public read, authenticated write)
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE theses ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE macro_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies: Allow public read access (dashboard is PIN protected)
CREATE POLICY "Public read" ON holdings FOR SELECT USING (true);
CREATE POLICY "Public read" ON prices FOR SELECT USING (true);
CREATE POLICY "Public read" ON transactions FOR SELECT USING (true);
CREATE POLICY "Public read" ON snapshots FOR SELECT USING (true);
CREATE POLICY "Public read" ON theses FOR SELECT USING (true);
CREATE POLICY "Public read" ON watchlist FOR SELECT USING (true);
CREATE POLICY "Public read" ON notes FOR SELECT USING (true);
CREATE POLICY "Public read" ON macro_indicators FOR SELECT USING (true);
CREATE POLICY "Public read" ON settings FOR SELECT USING (true);

-- Service role can write (Pinky uses service key)
CREATE POLICY "Service write" ON holdings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write" ON prices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write" ON snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write" ON theses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write" ON watchlist FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write" ON macro_indicators FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write" ON settings FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER holdings_updated_at BEFORE UPDATE ON holdings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER prices_updated_at BEFORE UPDATE ON prices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER theses_updated_at BEFORE UPDATE ON theses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER macro_updated_at BEFORE UPDATE ON macro_indicators FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Pinky Analysis Table (stores latest analysis only)
CREATE TABLE IF NOT EXISTS pinky_analysis (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pinky_analysis ENABLE ROW LEVEL SECURITY;

-- Allow public access (same as other tables)
CREATE POLICY "Allow public access" ON pinky_analysis FOR ALL USING (true);
