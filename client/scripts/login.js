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

  loginButton.addEventListener("click", async () => {
    clearError(); 

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showError("Benutzername und Passwort erforderlich!");
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
        showError(data.error || "Fehler beim Login");
        return;
      }

      sessionStorage.setItem("user", JSON.stringify(data));

      window.location.href = "/index.html";
    } catch (error) {
      showError("Serverfehler. Bitte später erneut versuchen.");
    }
  });

  usernameInput.addEventListener("input", clearError);
  passwordInput.addEventListener("input", clearError);
});
