import "./demo/installDemo"; // no-op unless VITE_DEMO_MODE=true (must load first)
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <App />
);
