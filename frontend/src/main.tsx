import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./app/App";
import { AppProviders } from "./app/providers/AppProviders";
import "./index.css";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
    registerSW({ immediate: true });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <AppProviders>
            <App />
        </AppProviders>
    </React.StrictMode>
);
