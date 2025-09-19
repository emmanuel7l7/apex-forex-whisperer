import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CurrencyPair {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change_value: number;
  change_percent: number;
  bid?: number;
  ask?: number;
  spread?: number;
  last_updated: string;
}

interface TradingSignal {
  id: string;
  symbol: string;
  signal_type: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: number;
  confidence: number;
  pattern_detected?: string;
  stop_loss?: number;
  take_profit?: number;
  risk_reward_ratio?: number;
  created_at: string;
  is_active: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'signal' | 'alert' | 'info' | 'warning';
  symbol?: string;
  priority: number;
  is_read: boolean;
  created_at: string;
}

export const useForexData = () => {
  const [currencyPairs, setCurrencyPairs] = useState<CurrencyPair[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch currency pairs
      const { data: pairs, error: pairsError } = await supabase
        .from('currency_pairs')
        .select('*')
        .order('symbol');

      if (pairsError) throw pairsError;

      // Fetch active signals
      const { data: signalsData, error: signalsError } = await supabase
        .from('trading_signals')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (signalsError) throw signalsError;

      // Fetch recent notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (notificationsError) throw notificationsError;

      setCurrencyPairs(pairs || []);
      setSignals((signalsData || []) as TradingSignal[]);
      setNotifications((notificationsData || []) as Notification[]);
      setError(null);

    } catch (err) {
      console.error('Error fetching forex data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const updateForexData = async () => {
    try {
      const response = await supabase.functions.invoke('fetch-forex-data');
      if (response.error) {
        throw response.error;
      }
      console.log('Forex data updated:', response.data);
    } catch (err) {
      console.error('Error updating forex data:', err);
    }
  };

  const runAIAnalysis = async () => {
    try {
      const response = await supabase.functions.invoke('ai-analysis');
      if (response.error) {
        throw response.error;
      }
      console.log('AI analysis completed:', response.data);
    } catch (err) {
      console.error('Error running AI analysis:', err);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up real-time subscriptions
    const currencyPairsChannel = supabase
      .channel('currency_pairs_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'currency_pairs'
        },
        (payload) => {
          console.log('Currency pair updated:', payload);
          setCurrencyPairs(prev => 
            prev.map(pair => 
              pair.id === payload.new.id ? payload.new as CurrencyPair : pair
            )
          );
        }
      )
      .subscribe();

    const signalsChannel = supabase
      .channel('signals_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trading_signals'
        },
        (payload) => {
          console.log('Trading signal updated:', payload);
          if (payload.eventType === 'INSERT') {
            setSignals(prev => [payload.new as TradingSignal, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setSignals(prev => 
              prev.map(signal => 
                signal.id === payload.new.id ? payload.new as TradingSignal : signal
              )
            );
          }
        }
      )
      .subscribe();

    const notificationsChannel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('New notification:', payload);
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    // Auto-refresh data every 30 seconds
    const interval = setInterval(() => {
      updateForexData();
      runAIAnalysis();
    }, 30000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(currencyPairsChannel);
      supabase.removeChannel(signalsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, []);

  // Combine currency pairs with their signals
  const enrichedPairs = currencyPairs.map(pair => {
    const signal = signals.find(s => s.symbol === pair.symbol && s.is_active);
    return {
      ...pair,
      signal: signal?.signal_type || 'NEUTRAL',
      strength: signal?.strength || 0,
      pattern: signal?.pattern_detected,
      stopLoss: signal?.stop_loss,
      takeProfit: signal?.take_profit
    };
  });

  return {
    currencyPairs: enrichedPairs,
    signals,
    notifications,
    loading,
    error,
    updateForexData,
    runAIAnalysis,
    markNotificationAsRead,
    unreadCount: notifications.filter(n => !n.is_read).length
  };
};