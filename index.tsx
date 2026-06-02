import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { LanguageProvider } from "./i18n";

const rootElement = document.getElementById("root")!;

if (window.location.pathname.startsWith("/tradesight")) {
  import("./tradesight/App.tsx").then((mod) => {
    createRoot(rootElement).render(
      <StrictMode>
        <mod.default />
      </StrictMode>
    );
  });
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </StrictMode>
  );
}
