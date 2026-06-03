import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { datadogRum } from '@datadog/browser-rum';

const DATADOG_APP_ID = import.meta.env.VITE_DATADOG_APP_ID;
const DATADOG_CLIENT_TOKEN = import.meta.env.VITE_DATADOG_CLIENT_TOKEN;
const DATADOG_SITE = import.meta.env.VITE_DATADOG_SITE || 'datadoghq.com';
const ENV = import.meta.env.VITE_ENV || 'development';

if (DATADOG_APP_ID && DATADOG_CLIENT_TOKEN) {
  datadogRum.init({
    applicationId: DATADOG_APP_ID,
    clientToken: DATADOG_CLIENT_TOKEN,
    site: DATADOG_SITE,
    service: 'tym2muv-web',
    env: ENV,
    version: '1.0.0',
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'mask-user-input',
  });
  
  datadogRum.startSessionReplayRecording();
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);