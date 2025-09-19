import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting AI analysis...');

    // Fetch current currency pairs data
    const { data: currencyPairs, error: fetchError } = await supabase
      .from('currency_pairs')
      .select('*')
      .order('last_updated', { ascending: false });

    if (fetchError) {
      console.error('Error fetching currency pairs:', fetchError);
      throw fetchError;
    }

    console.log('Fetched currency pairs:', currencyPairs?.length);

    // Generate AI analysis for each pair
    for (const pair of currencyPairs || []) {
      try {
        // Simulate AI pattern analysis based on price action and volatility
        const analysis = generateTechnicalAnalysis(pair);
        const signal = generateTradingSignal(pair, analysis);
        
        console.log(`Generated analysis for ${pair.symbol}:`, { signal: signal.signal_type, strength: signal.strength });

        // Save analysis to database
        const { error: analysisError } = await supabase
          .from('market_analysis')
          .insert({
            symbol: pair.symbol,
            timeframe: '1h',
            analysis_type: 'ml_prediction',
            data: analysis,
            confidence_score: signal.confidence
          });

        if (analysisError) {
          console.error(`Error saving analysis for ${pair.symbol}:`, analysisError);
        }

        // Deactivate old signals
        await supabase
          .from('trading_signals')
          .update({ is_active: false })
          .eq('symbol', pair.symbol);

        // Save new signal
        const { error: signalError } = await supabase
          .from('trading_signals')
          .insert(signal);

        if (signalError) {
          console.error(`Error saving signal for ${pair.symbol}:`, signalError);
        }

        // Generate notifications for high-strength signals
        if (signal.strength >= 80) {
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              title: `Strong ${signal.signal_type} Signal`,
              message: `${pair.symbol} showing ${signal.strength}% confidence ${signal.signal_type} signal`,
              type: 'signal',
              symbol: pair.symbol,
              priority: signal.strength >= 90 ? 5 : 4,
              data: {
                signal_type: signal.signal_type,
                strength: signal.strength,
                pattern: signal.pattern_detected
              }
            });

          if (notificationError) {
            console.error(`Error creating notification for ${pair.symbol}:`, notificationError);
          }
        }
        
      } catch (error) {
        console.error(`Error processing ${pair.symbol}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analyzed: currencyPairs?.length || 0,
        message: 'AI analysis completed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in AI analysis function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'AI analysis failed', 
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

function generateTechnicalAnalysis(pair: any) {
  const priceMovement = Math.abs(pair.change_percent);
  const volatility = priceMovement > 1 ? 'high' : priceMovement > 0.5 ? 'medium' : 'low';
  
  // Simulate various technical indicators
  const rsi = 30 + (Math.random() * 40); // RSI between 30-70
  const macd = pair.change_percent > 0 ? 'bullish' : 'bearish';
  const support = pair.price * (0.995 - Math.random() * 0.01);
  const resistance = pair.price * (1.005 + Math.random() * 0.01);
  
  return {
    volatility,
    rsi,
    macd,
    support,
    resistance,
    trend: pair.change_percent > 0.2 ? 'bullish' : pair.change_percent < -0.2 ? 'bearish' : 'sideways',
    momentum: priceMovement > 0.5 ? 'strong' : 'weak'
  };
}

function generateTradingSignal(pair: any, analysis: any) {
  // Enhanced signal generation based on multiple factors
  let strength = 50;
  let signal_type = 'NEUTRAL';
  let confidence = 50;
  let patterns = [];

  // Price momentum analysis
  if (Math.abs(pair.change_percent) > 0.5) {
    strength += 20;
    patterns.push('momentum_breakout');
  }

  // Volatility analysis
  if (analysis.volatility === 'high') {
    strength += 10;
    patterns.push('high_volatility');
  }

  // RSI analysis
  if (analysis.rsi < 35) {
    signal_type = 'BUY';
    strength += 15;
    patterns.push('oversold');
  } else if (analysis.rsi > 65) {
    signal_type = 'SELL';
    strength += 15;
    patterns.push('overbought');
  }

  // MACD analysis
  if (analysis.macd === 'bullish' && pair.change_percent > 0) {
    signal_type = signal_type === 'NEUTRAL' ? 'BUY' : signal_type;
    strength += 10;
    patterns.push('macd_bullish');
  } else if (analysis.macd === 'bearish' && pair.change_percent < 0) {
    signal_type = signal_type === 'NEUTRAL' ? 'SELL' : signal_type;
    strength += 10;
    patterns.push('macd_bearish');
  }

  // Special boost for Gold (XAUUSD) due to market conditions
  if (pair.symbol === 'XAUUSD') {
    strength += 15;
    patterns.push('gold_premium');
  }

  // Cap strength at 100
  strength = Math.min(100, strength);
  confidence = strength * 0.8; // Confidence is typically lower than strength

  // Calculate stop loss and take profit
  const stopLossMultiplier = signal_type === 'BUY' ? 0.995 : 1.005;
  const takeProfitMultiplier = signal_type === 'BUY' ? 1.015 : 0.985;
  
  return {
    symbol: pair.symbol,
    signal_type,
    strength,
    confidence,
    analysis_data: analysis,
    pattern_detected: patterns.join(', '),
    timeframe: '1h',
    stop_loss: pair.price * stopLossMultiplier,
    take_profit: pair.price * takeProfitMultiplier,
    risk_reward_ratio: 1.5,
    expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours from now
  };
}