import { useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

export interface SubscriptionConfig {
  table: string;
  schema?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
}

export function useRealtimeSubscription<T extends Record<string, any>>(
  config: SubscriptionConfig,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void,
  enabled: boolean = true
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  useEffect(() => {
    if (!enabled) return;
    
    const { table, schema = 'public', event = '*', filter } = config;
    
    // Generate unique channel name to prevent duplicates if multiple components subscribe
    const filterString = filter ? `:${filter}` : '';
    const channelName = `realtime:${schema}:${table}:${event}${filterString}`;
    
    logger.info(`[Realtime] Subscribing to: ${channelName}`);
    
    const channel = supabase.channel(channelName);
    
    const binding = channel.on(
      'postgres_changes',
      { event, schema, table, filter },
      (payload) => {
        // We know the payload corresponds to our table
        callback(payload as RealtimePostgresChangesPayload<T>);
      }
    );
    
    binding.subscribe((status) => {
      logger.info(`[Realtime] Subscription status for ${channelName}: ${status}`);
    });
    
    channelRef.current = channel;
    
    return () => {
      if (channelRef.current) {
        logger.info(`[Realtime] Unsubscribing from: ${channelName}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [
    config.table, 
    config.schema, 
    config.event, 
    config.filter, 
    enabled,
    // Note: We don't include callback here to avoid re-subscribing on every render 
    // if the consumer passes an inline function. The downside is the callback 
    // closure might be stale if it relies on changing external state. 
    // For this app's architecture, we rely on state setters (e.g. setMessages(prev => ...))
  ]);
}
