document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("login");
  const errorBox = document.getElementById("error-box");

  // 🔹 Funktion zum Anzeigen von Fehlern im UI
  const showError = (message) => {
    errorBox.textContent = message;
    errorBox.style.display = "block";
  };

  // 🔹 Fehler entfernen, wenn der Nutzer etwas Neues eingibt
  const clearError = () => {
    errorBox.style.display = "none";
  };

  // 🔹 Login-Button Click-Event
  loginButton.addEventListener("click", async () => {
    clearError(); // Vorherige Fehler zurücksetzen

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showError("Benutzername und Passwort erforderlich!");
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.error || "Fehler beim Login");
        return;
      }

      if (data.token) {
        localStorage.setItem("user", JSON.stringify(data));
        window.location.href = "/";
      } else {
        showError("Fehler: Ungültige Antwort vom Server");
      }
    } catch (error) {
      showError("Serverfehler. Bitte später erneut versuchen.");
    }
  });

  // 🔹 Fehler verschwinden, wenn der Nutzer neu eingibt
  usernameInput.addEventListener("input", clearError);
  passwordInput.addEventListener("input", clearError);
});
