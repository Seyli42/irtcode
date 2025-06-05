import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { InterventionProvider } from './context/InterventionContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <InterventionProvider>
          <App />
        </InterventionProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);