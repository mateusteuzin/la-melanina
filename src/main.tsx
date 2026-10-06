import "./styles.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Index } from "./routes/index";
import { Admin } from "./admin/Admin";

const queryClient = new QueryClient();

if (window.location.pathname.replace(/\/$/, '') === '/admin') {
  document.title = 'La Melanina Admin';
  const manifest = document.createElement('link');
  manifest.rel = 'manifest';
  manifest.href = '/admin.webmanifest';
  document.head.appendChild(manifest);
  const touchIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (touchIcon) touchIcon.href = '/admin-icon-180.png';
  for (const [name, content] of Object.entries({
    'theme-color': '#591b2b',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-title': 'Melanina Admin',
  })) {
    const meta = document.createElement('meta');
    meta.name = name;
    meta.content = content;
    document.head.appendChild(meta);
  }
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/admin-sw.js', { scope: '/admin' })
        .catch(error => console.error('Não foi possível preparar a instalação do painel.', error));
    });
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {window.location.pathname.replace(/\/$/, '') === '/admin' ? <Admin /> : <Index />}
    </QueryClientProvider>
  </React.StrictMode>,
);