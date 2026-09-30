import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ReduxProvider, TanstackProvider } from "@/providers";
import "./index.css";
import { Toaster } from "sonner";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TanstackProvider>
      <ReduxProvider>
        <App />
        <Toaster position="bottom-right" richColors />
      </ReduxProvider>
    </TanstackProvider>
  </StrictMode>,
);
