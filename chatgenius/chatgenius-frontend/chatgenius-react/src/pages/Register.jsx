import { API_URL } from "../config";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/auth.css";
import "../styles/modal.css"; // Import modal styles

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");

    if (!email.endsWith("@gmail.com")) {
      setEmailError("Only @gmail.com email is allowed");
      return;
    }

    const passwordRule = /^[A-Z][A-Za-z0-9@#$_]{5,}$/;
    if (!passwordRule.test(password)) {
      setPasswordError(
        "Password must start with a capital letter and be at least 6 characters"
      );
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          username: email.split('@')[0],
          full_name: name
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setPasswordError(result.error || "Registration failed");
        return;
      }

      setShowSuccessModal(true);
    } catch (err) {
      console.error("Registration error:", err);
      setPasswordError("Server connection error");
    }
  }

  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigate("/login");
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} autoComplete="off">
        <h2>Create Account</h2>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {emailError && <p className="error-text">{emailError}</p>}

        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            👁️
          </span>
        </div>

        <div className="password-wrapper">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <span
            className="toggle-password"
            onClick={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
          >
            👁️
          </span>
        </div>

        {passwordError && <p className="error-text">{passwordError}</p>}

        <button type="submit">Register</button>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </form>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <span className="modal-icon">🎉</span>
            <h3>Registration Successful!</h3>
            <p>Your account has been created. You can now log in to start chatting.</p>
            <div className="modal-actions">
              <button className="primary" onClick={handleModalClose}>
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
