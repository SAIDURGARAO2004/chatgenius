import { API_URL } from "../config";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/auth.css";

export default function Login() {
  const navigate = useNavigate();


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");



  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Login failed");
        return;
      }

      // ✅ Save login data
      localStorage.setItem("userToken", result.access_token);
      localStorage.setItem("userId", result.user_id);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userUsername", result.username);

      // ✅ Store full user object (important for avatar & profile)
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: result.user_id,
          name: result.username,
          email: email
        })
      );

      const pendingGroup = localStorage.getItem("pendingGroupJoin");
      if (pendingGroup) {
        localStorage.removeItem("pendingGroupJoin");
        navigate(`/group/${pendingGroup}`);
      } else {
        navigate("/chat");
      }

    } catch (err) {
      console.error("Login error:", err);
      setError("Server connection error");
    }
  };



  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} autoComplete="off">
        <h2>Login</h2>

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            className="toggle-password small-eye"
            onClick={() => setShowPassword(!showPassword)}
          >
            👁️
          </span>
        </div>

        {error && <p className="error-text">{error}</p>}

        <button type="submit">Login</button>

        <div className="auth-footer">
          Don’t have an account? <Link to="/register">Create one</Link>
        </div>
      </form>
    </div>
  );
}
