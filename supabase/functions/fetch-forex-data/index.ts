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

const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY');
const FOREX_SYMBOLS = ['OANDA:EUR_USD', 'OANDA:GBP_USD', 'OANDA:USD_JPY', 'OANDA:XAU_USD', 'OANDA:GBP_JPY', 'OANDA:EUR_JPY'];
const CRYPTO_SYMBOLS = ['BINANCE:BTCUSDT'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting forex data fetch...');

    // Fetch forex data from Finnhub
    const forexPromises = FOREX_SYMBOLS.map(async (symbol) => {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      );
      
      if (!response.ok) {
        console.error(`Failed to fetch ${symbol}: ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      console.log(`Fetched ${symbol}:`, data);
      
      // Map to our database format
      const dbSymbol = symbol.replace('OANDA:', '').replace('_', '');
      const change = data.d || 0;
      const changePercent = data.dp || 0;
      
      return {
        symbol: dbSymbol,
        price: data.c || 0,
        change_value: change,
        change_percent: changePercent,
        bid: data.c ? data.c - 0.0001 : 0, // Simplified bid/ask
        ask: data.c ? data.c + 0.0001 : 0,
        spread: 0.0002
      };
    });

    // Fetch crypto data
    const cryptoPromises = CRYPTO_SYMBOLS.map(async (symbol) => {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      );
      
      if (!response.ok) {
        console.error(`Failed to fetch ${symbol}: ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      console.log(`Fetched ${symbol}:`, data);
      
      return {
        symbol: 'BTCUSD',
        price: data.c || 0,
        change_value: data.d || 0,
        change_percent: data.dp || 0,
        bid: data.c ? data.c - 1 : 0,
        ask: data.c ? data.c + 1 : 0,
        spread: 2
      };
    });

    // Wait for all API calls to complete
    const allResults = await Promise.all([...forexPromises, ...cryptoPromises]);
    const validResults = allResults.filter(result => result !== null);

    console.log('Valid results:', validResults);

    // Update database with new prices
    for (const result of validResults) {
      const { error } = await supabase
        .from('currency_pairs')
        .update({
          price: result.price,
          change_value: result.change_value,
          change_percent: result.change_percent,
          bid: result.bid,
          ask: result.ask,
          spread: result.spread,
          last_updated: new Date().toISOString()
        })
        .eq('symbol', result.symbol);

      if (error) {
        console.error(`Error updating ${result.symbol}:`, error);
      } else {
        console.log(`Updated ${result.symbol} successfully`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: validResults.length,
        message: `Successfully updated ${validResults.length} currency pairs` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in fetch-forex-data function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch forex data', 
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});