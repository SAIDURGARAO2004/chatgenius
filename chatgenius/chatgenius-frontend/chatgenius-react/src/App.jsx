import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import { DEMO } from "./config";
import Chat from "./pages/Chat";
import Images from "./pages/Images"; // ✅ MUST be this path
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import YearReview from "./pages/YearReview";

// Demo mode is hosted as static files (e.g. GitHub Pages), where HashRouter
// avoids 404s on refresh. The normal build keeps clean BrowserRouter URLs.
const Router = DEMO ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/group/:conversationId" element={<Chat />} />
        <Route path="/images" element={<Images />} />
        <Route path="/year-review" element={<YearReview />} />
      </Routes>
    </Router>
  );
}


