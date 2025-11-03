import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './modules/App';

declare global {
  interface Window {
    openai?: {
      sendEvent: (event: string, payload: Record<string, unknown>) => void;
    };
  }
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('OpenAI Apps UI root element not found.');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
