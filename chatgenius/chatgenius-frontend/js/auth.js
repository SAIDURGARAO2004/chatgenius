/* ======================================
   LOGIN PAGE
====================================== */
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value.trim();
    const errorBox = document.getElementById("error-message");

    if (!email || !password) {
      if (errorBox) errorBox.textContent = "All fields required";
      return;
    }

    // ✅ REAL LOGIN (WITH BACKEND)
    try {
      const response = await fetch(`${CONFIG.API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (!response.ok) {
        if (errorBox) errorBox.textContent = result.error || "Login failed";
        return;
      }

      // Store user credentials return by backend
      localStorage.setItem("token", result.access_token);
      localStorage.setItem("userId", result.user_id);
      localStorage.setItem("userEmail", email);
      
      // Store user metadata for display (initials, etc)
      localStorage.setItem("user", JSON.stringify({
        id: result.user_id,
        email: email,
        name: result.username || email.split('@')[0]
      }));

      window.location.href = "chat.html";
    } catch (err) {
      console.error("Login error:", err);
      if (errorBox) errorBox.textContent = "Server connection error";
    }
  });
}

/* ======================================
   REGISTER PAGE + EMAIL + PASSWORD VALIDATION
====================================== */
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");

    emailError.textContent = "";
    passwordError.textContent = "";

    /* ===== EMAIL VALIDATION (ONLY GMAIL) ===== */
    if (!isValidGmail(email)) {
      emailError.textContent =
        "Please enter a valid Gmail address (example@gmail.com)";
      return;
    }

    /* ===== PASSWORD VALIDATION ===== */
    const passwordRegex = /^[A-Z](?=.*\d)[A-Za-z\d]{5,}$/;

    if (!passwordRegex.test(password)) {
      passwordError.textContent =
        "Password must start with CAPITAL letter, be at least 6 characters, and include a number";
      return;
    }

    /* ===== CONFIRM PASSWORD ===== */
    if (password !== confirmPassword) {
      passwordError.textContent = "Passwords do not match";
      return;
    }

    // ✅ REAL REGISTRATION (WITH BACKEND)
    const registerUser = async () => {
      try {
        const response = await fetch(`${CONFIG.API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email, 
            password,
            username: email.split('@')[0]
          })
        });

        const result = await response.json();

        if (!response.ok) {
          passwordError.textContent = result.error || "Registration failed";
          return;
        }

        alert("Registration successful!");
        registerForm.reset();
        window.location.href = "login.html";
      } catch (err) {
        console.error("Registration error:", err);
        passwordError.textContent = "Server connection error";
      }
    };

    registerUser();
  });
}



/* ======================================
   SHOW / HIDE PASSWORD (LOGIN + REGISTER)
====================================== */
document.addEventListener("DOMContentLoaded", () => {
  const toggles = document.querySelectorAll(".toggle-password");

  toggles.forEach(btn => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;

      input.type = input.type === "password" ? "text" : "password";
      btn.textContent = input.type === "password" ? "👁️" : "🙈";
    });
  });
});

function isValidEmail(email) {
  // Professional email regex
  const emailPattern =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return emailPattern.test(email);
}

function isValidGmail(email) {
  // ONLY allows correct @gmail.com
  const gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  return gmailPattern.test(email);
}
