import './styles/main.css';

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './app/App';
import { AppProviders } from './app/providers';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root container missing in index.html');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
);
