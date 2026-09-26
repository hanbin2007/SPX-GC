import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';

const container = document.getElementById('studio-root');
if (container) {
  createRoot(container).render(<StrictMode><App /></StrictMode>);
}
