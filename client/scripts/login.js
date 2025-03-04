document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("login");
  const errorBox = document.getElementById("error-box");

  const showError = (message) => {
    errorBox.textContent = message;
    errorBox.style.display = "block";
  };

  const clearError = () => {
    errorBox.style.display = "none";
  };

  const sanitizeInput = (input) => {
    return input.replace(/[<>]/g, ""); 
  };

  loginButton.addEventListener("click", async () => {
    clearError();

    let username = usernameInput.value.trim();
    let password = passwordInput.value.trim();

    username = sanitizeInput(username); 
    password = sanitizeInput(password);

    if (!username || !password) {
      showError("⚠️ Benutzername und Passwort erforderlich!");
      return;
    }

    if (username.length > 30 || password.length > 50) {
      showError("⚠️ Eingaben sind zu lang!");
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.error || "❌ Fehler beim Login");
        return;
      }

      window.location.href = "/index.html";
    } catch (error) {
      showError("❌ Serverfehler. Bitte später erneut versuchen.");
    }
  });

  usernameInput.addEventListener("input", clearError);
  passwordInput.addEventListener("input", clearError);
});
