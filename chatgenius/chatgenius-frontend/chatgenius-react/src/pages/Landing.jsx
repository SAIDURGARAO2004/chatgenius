import { Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import "../styles/base.css";
import "../css/landing.css";

// Inline SVG Icons for the feature cards
const Icons = {
  Chat: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 9h.01" /><path d="M12 9h.01" /><path d="M16 9h.01" /></svg>
  ),
  Brain: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h1Z" /><path d="M14.5 2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h1Z" /><path d="M21 15c0 4.625-3.507 8.441-8 8.941V22h-2v.941c-4.493-.5-8-4.316-8-8.941 0-2.21 1.79-4 4-4h.5c.276 0 .5-.224.5-.5v-1c0-2.21 1.79-4 4-4h2c2.21 0 4 1.79 4 4v1c0 .276.224.5.5.5h.5c2.21 0 4 1.79 4 4Z" /><path d="M9 13v1" /><path d="M12 12v3" /><path d="M15 13v1" /></svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  Shield: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><rect x="9" y="10" width="6" height="4" rx="1" /><path d="M12 10v4" /></svg>
  ),
  Zap: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
  ),
  Smartphone: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
  ),
};

export default function Landing() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = useMemo(() => [
    { title: "Real-time Messaging", desc: "Instant message delivery with real-time updates", icon: <Icons.Chat /> },
    { title: "AI Powered", desc: "Smart responses and assistance using Gemini API", icon: <Icons.Brain /> },
    { title: "Group Chats", desc: "Create and manage group conversations seamlessly", icon: <Icons.Users /> },
    { title: "Secure & Private", desc: "Your data is protected with end-to-end security", icon: <Icons.Shield /> },
    { title: "Fast & Reliable", desc: "High performance platform for smooth communication", icon: <Icons.Zap /> },
    { title: "Modern UI", desc: "Clean, responsive and beautiful user experience", icon: <Icons.Smartphone /> },
  ], []);

  return (
    <main className="landing-container">
      <div className="bg-ambience"></div>

      <div className="hero-section">
        <div className="arc-environment">
          <svg className="main-arc-svg" viewBox="0 0 1000 500">
            <defs>
              <filter id="arcGlow" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Static Arc Layers */}
            <path className="arc-path arc-back-2" d="M 20 450 A 480 480 0 0 1 980 450" />
            <path className="arc-path arc-back" d="M 50 450 A 450 450 0 0 1 950 450" />
            <path className="arc-path arc-mid" d="M 100 450 A 400 400 0 0 1 900 450" />
            <path className="arc-path arc-front" d="M 150 450 A 350 350 0 0 1 850 450" />

            {/* Optimized Light Streaks (Reduced to 3) */}
            <path className="arc-streak s1" d="M 50 450 A 450 450 0 0 1 950 450" strokeDasharray="200 1000" />
            <path className="arc-streak s2" d="M 100 450 A 400 400 0 0 1 900 450" strokeDasharray="150 1000" />
            <path className="arc-streak s3" d="M 150 450 A 350 350 0 0 1 850 450" strokeDasharray="100 1000" />

            {/* Optimized Particles (Reduced to 5, only 3 animated) */}
            <circle className="arc-particle p1" r="1.5">
              <animateMotion dur="5s" repeatCount="indefinite" path="M 50 450 A 450 450 0 0 1 950 450" />
            </circle>
            <circle className="arc-particle p2" r="1">
              <animateMotion dur="7s" repeatCount="indefinite" path="M 100 450 A 400 400 0 0 1 900 450" begin="1s" />
            </circle>
            <circle className="arc-particle p3" r="1.2">
              <animateMotion dur="9s" repeatCount="indefinite" path="M 150 450 A 350 350 0 0 1 850 450" begin="2s" />
            </circle>
          </svg>

          <div className="floor-surface">
            <div className="floor-glow"></div>
            <div className="floor-reflection-rings"></div>
            <div className="floor-bloom"></div>
          </div>
        </div>

        <div className={`hero-content ${isVisible ? 'active' : ''}`}>
          <h1 className="main-title">ChatGenius</h1>
          <p className="main-subtitle">
            A modern real-time chat platform powered by <span className="highlight">AI intelligence</span>
          </p>

          <div className="cta-group">
            <Link to="/login" className="btn-primary">Login</Link>
            <Link to="/register" className="btn-outline">Create Account</Link>
          </div>
        </div>
      </div>

      <div className="features-container">
        <div className="features-grid">
          {features.map((feature, i) => (
            <div
              key={i}
              className="feature-card"
              style={{ animationDelay: `${0.5 + i * 0.05}s` }}
            >
              <div className="card-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="pro-footer">
        <div className="footer-content">

          <div className="footer-brand">
            <h2>ChatGenius</h2>
            <p>Real-time AI-powered communication platform.</p>
          </div>

          <div className="footer-links">
            <div className="link-group">
              <h4>Product</h4>
              <a href="#">Features</a>
              <a href="#">Security</a>
              <a href="#">Updates</a>
            </div>
            <div className="link-group">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
            </div>
            <div className="link-group">
              <h4>Resources</h4>
              <a href="#">Documentation</a>
              <a href="#">Help Center</a>
              <a href="#">Privacy Policy</a>
            </div>
          </div>

        </div>

        <div className="footer-bottom">
          © 2025 ChatGenius. All rights reserved.
        </div>
      </footer>
    </main>
  );
}