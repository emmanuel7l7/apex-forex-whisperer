-- Complete Database Setup for Forex Trading Bot
-- Run this SQL in your Supabase SQL Editor

-- Create table for currency pairs and their real-time data
CREATE TABLE public.currency_pairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price DECIMAL(15,5) NOT NULL DEFAULT 0,
  change_value DECIMAL(15,5) NOT NULL DEFAULT 0,
  change_percent DECIMAL(10,4) NOT NULL DEFAULT 0,
  bid DECIMAL(15,5),
  ask DECIMAL(15,5),
  spread DECIMAL(15,5),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for AI analysis and signals
CREATE TABLE public.trading_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('BUY', 'SELL', 'NEUTRAL')),
  strength INTEGER NOT NULL CHECK (strength >= 0 AND strength <= 100),
  confidence DECIMAL(5,2) NOT NULL DEFAULT 0,
  analysis_data JSONB,
  pattern_detected TEXT,
  timeframe TEXT DEFAULT '1h',
  stop_loss DECIMAL(15,5),
  take_profit DECIMAL(15,5),
  risk_reward_ratio DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create table for market analysis and AI insights
CREATE TABLE public.market_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL DEFAULT '1h',
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('technical', 'sentiment', 'pattern', 'ml_prediction')),
  data JSONB NOT NULL,
  confidence_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for real-time notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('signal', 'alert', 'info', 'warning')),
  symbol TEXT,
  priority INTEGER NOT NULL DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  is_read BOOLEAN NOT NULL DEFAULT false,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_currency_pairs_symbol ON public.currency_pairs(symbol);
CREATE INDEX idx_currency_pairs_last_updated ON public.currency_pairs(last_updated DESC);
CREATE INDEX idx_trading_signals_symbol_active ON public.trading_signals(symbol, is_active);
CREATE INDEX idx_trading_signals_created_at ON public.trading_signals(created_at DESC);
CREATE INDEX idx_market_analysis_symbol_timeframe ON public.market_analysis(symbol, timeframe);
CREATE INDEX idx_market_analysis_created_at ON public.market_analysis(created_at DESC);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(is_read) WHERE is_read = false;

-- Enable Row Level Security
ALTER TABLE public.currency_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (since no auth required)
CREATE POLICY "Allow public read access to currency_pairs" ON public.currency_pairs FOR SELECT USING (true);
CREATE POLICY "Allow public read access to trading_signals" ON public.trading_signals FOR SELECT USING (true);
CREATE POLICY "Allow public read access to market_analysis" ON public.market_analysis FOR SELECT USING (true);
CREATE POLICY "Allow public read access to notifications" ON public.notifications FOR SELECT USING (true);

-- Allow public write access for notifications (to mark as read)
CREATE POLICY "Allow public update to notifications" ON public.notifications FOR UPDATE USING (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.currency_pairs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trading_signals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_analysis;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Set replica identity for realtime
ALTER TABLE public.currency_pairs REPLICA IDENTITY FULL;
ALTER TABLE public.trading_signals REPLICA IDENTITY FULL;
ALTER TABLE public.market_analysis REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Insert initial currency pairs
INSERT INTO public.currency_pairs (symbol, name) VALUES
('EURUSD', 'Euro / US Dollar'),
('GBPUSD', 'British Pound / US Dollar'),
('USDJPY', 'US Dollar / Japanese Yen'),
('XAUUSD', 'Gold / US Dollar'),
('GBPJPY', 'British Pound / Japanese Yen'),
('EURJPY', 'Euro / Japanese Yen'),
('BTCUSD', 'Bitcoin / US Dollar'),
('US100', 'US Tech 100');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on currency pairs
CREATE TRIGGER update_currency_pairs_updated_at
  BEFORE UPDATE ON public.currency_pairs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add some sample trading signals to get started
INSERT INTO public.trading_signals (symbol, signal_type, strength, confidence, pattern_detected) VALUES
('EURUSD', 'BUY', 75, 82.5, 'Golden Cross'),
('GBPUSD', 'SELL', 65, 71.3, 'Bearish Divergence'),
('USDJPY', 'NEUTRAL', 45, 52.0, 'Consolidation');

-- Add a welcome notification
INSERT INTO public.notifications (title, message, type, priority) VALUES
('Welcome to Forex Trading Bot', 'Your database is now set up and ready to trade!', 'info', 3);
