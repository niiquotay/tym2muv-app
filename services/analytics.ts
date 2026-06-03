import { datadogRum } from '@datadog/browser-rum';
import { logger } from '../utils/logger';

export const trackEvent = (eventName: string, context?: Record<string, any>) => {
  // Pass to Datadog RUM as custom action
  if (datadogRum.getInternalContext()) {
     datadogRum.addAction(eventName, context);
  }
  // And log it for custom metrics parsing
  logger.info(`event:${eventName}`, context);
};

export const analytics = {
  listingCreated: (propertyId: string, location: string, agentId: string) => 
    trackEvent('listing_created', { propertyId, location, agentId }),
  
  paymentAttempt: (status: 'success' | 'failure', amount: number, method: string, errorMsg?: string) =>
    trackEvent('payment_processed', { status, amount, method, errorMsg }),
    
  searchPerformed: (query: string, location: string, filters: Record<string, any>) =>
    trackEvent('search_performed', { query, location, filters }),
    
  chatMessageSent: (chatId: string) =>
    trackEvent('chat_message_sent', { chatId }),
    
  userSignup: (role: 'Tenant' | 'Agent', method: string) =>
    trackEvent('user_signup', { role, method })
};
