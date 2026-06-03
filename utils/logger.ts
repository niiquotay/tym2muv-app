import { datadogLogs } from '@datadog/browser-logs';

const isProd = import.meta.env.PROD;
const DATADOG_CLIENT_TOKEN = import.meta.env.VITE_DATADOG_CLIENT_TOKEN;
const DATADOG_SITE = import.meta.env.VITE_DATADOG_SITE || 'datadoghq.com';
const ENV = import.meta.env.VITE_ENV || 'development';

if (DATADOG_CLIENT_TOKEN) {
  datadogLogs.init({
    clientToken: DATADOG_CLIENT_TOKEN,
    site: DATADOG_SITE,
    forwardErrorsToLogs: true,
    sessionSampleRate: 100,
    service: 'tym2muv-web',
    env: ENV,
  });
}

// Helper to attach user context to logs/RUM internally from auth context if needed later
// datadogLogs.logger.setContext({ userId, role })

export const logger = {
  debug: (message: string, context?: Record<string, any>) => {
    if (!isProd) {
       console.debug('[DEBUG]', message, context);
    }
    if (DATADOG_CLIENT_TOKEN) {
      datadogLogs.logger.debug(message, context);
    }
  },
  error: (error: any, context?: Record<string, any>) => {
    const errorMsg = error?.message || error;
    if (isProd) {
      console.error('[ERROR]', errorMsg, context);
    } else {
      console.error('[ERROR]', error, context);
    }
    if (DATADOG_CLIENT_TOKEN) {
       datadogLogs.logger.error(errorMsg, { error, ...context });
    }
  },
  warn: (message: string, context?: Record<string, any>) => {
    if (!isProd) console.warn('[WARN]', message, context);
    if (DATADOG_CLIENT_TOKEN) {
      datadogLogs.logger.warn(message, context);
    }
  },
  info: (message: string, context?: Record<string, any>) => {
    if (!isProd) console.info('[INFO]', message, context);
    if (DATADOG_CLIENT_TOKEN) {
       datadogLogs.logger.info(message, context);
    }
  }
};
