import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MapsProvider, ReduxProvider, TanstackProvider } from "@/providers";
import "./index.css";
import { Toaster } from "sonner";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TanstackProvider>
      <ReduxProvider>
        <MapsProvider>
          <App />
        </MapsProvider>
        <Toaster position="bottom-right" richColors />
      </ReduxProvider>
    </TanstackProvider>
  </StrictMode>,
);
