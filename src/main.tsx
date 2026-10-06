import "./styles.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Index } from "./routes/index";
import { Admin } from "./admin/Admin";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {window.location.pathname.replace(/\/$/, '') === '/admin' ? <Admin /> : <Index />}
    </QueryClientProvider>
  </React.StrictMode>,
);


