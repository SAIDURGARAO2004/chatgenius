// Installs the in-browser mock API by wrapping window.fetch (demo mode only).
import { API_URL, DEMO } from "../config";
import { handleRequest } from "./mockBackend";
import { dispatchDemoEvent } from "./demoSocket";

function toPlainHeaders(h) {
  const out = {};
  if (!h) return out;
  if (typeof Headers !== "undefined" && h instanceof Headers) {
    h.forEach((v, k) => (out[k] = v));
    return out;
  }
  return { ...h };
}

async function parseBody(body) {
  if (!body) return { body: {}, files: [] };
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    const fields = {};
    const files = [];
    for (const [k, v] of body.entries()) {
      if (v instanceof File) files.push(v.name);
      else fields[k] = v;
    }
    return { body: fields, files };
  }
  if (typeof body === "string") {
    try {
      return { body: JSON.parse(body), files: [] };
    } catch {
      return { body: {}, files: [] };
    }
  }
  return { body: {}, files: [] };
}

function showBadge() {
  const add = () => {
    const el = document.createElement("div");
    el.textContent = "Demo mode: your data stays in this browser";
    el.style.cssText =
      "position:fixed;top:4px;left:50%;transform:translateX(-50%);z-index:9999;" +
      "font:600 11px Inter,system-ui,sans-serif;color:#fff;background:rgba(37,99,235,.9);" +
      "padding:2px 10px;border-radius:999px;pointer-events:none;";
    document.body.appendChild(el);
  };
  if (document.body) add();
  else window.addEventListener("DOMContentLoaded", add);
}

if (DEMO && typeof window !== "undefined" && !window.__chatgeniusDemoInstalled) {
  window.__chatgeniusDemoInstalled = true;
  const realFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url;
    if (!url.startsWith(API_URL)) return realFetch(input, init);

    const path = url.slice(API_URL.length).split("?")[0];
    const { body, files } = await parseBody(init.body);
    const method = (init.method || "GET").toUpperCase();

    // small delay so the UI feels like a real request (longer for the AI)
    await new Promise((r) => setTimeout(r, path.startsWith("/ai/chat") ? 700 : 150));

    const { status, json } = await handleRequest(
      { method, path, headers: toPlainHeaders(init.headers), body, files },
      window.localStorage,
      { emit: (event, data, delay = 0) => setTimeout(() => dispatchDemoEvent(event, data), delay) }
    );

    return new Response(JSON.stringify(json), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  };

  showBadge();
}
