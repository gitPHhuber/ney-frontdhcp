import React from 'react';

export const AppLoader: React.FC = () => (
  <div className="app-loader">
    <div className="app-loader__spinner" aria-hidden />
    <span className="sr-only">Loading application…</span>
  </div>
);
