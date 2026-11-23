// DEMO mode: the whole app runs in the browser with no backend (see src/demo/).
// Enabled by VITE_DEMO_MODE=true (used by `npm run build:demo`).
export const DEMO = import.meta.env.VITE_DEMO_MODE === "true";

// Base URL of the Flask backend (no trailing slash).
// Set VITE_API_URL in .env (see .env.example). Defaults to the local backend.
// In demo mode this is a placeholder host that the in-browser mock intercepts.
export const API_URL = DEMO
  ? "https://demo.chatgenius.invalid"
  : (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

// ---- routing helpers that work for both BrowserRouter and demo HashRouter ----

// Current in-app route, e.g. "/group/5"
export function currentRoutePath() {
  if (DEMO) return window.location.hash.replace(/^#/, "") || "/";
  return window.location.pathname;
}

// Absolute shareable link to an in-app route, e.g. appLink("/group/5")
export function appLink(path) {
  if (DEMO) return `${window.location.origin}${window.location.pathname}#${path}`;
  return `${window.location.origin}${path}`;
}
