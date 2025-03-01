document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("login");
  const errorText = document.getElementById("error");

  loginButton.addEventListener("click", async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;

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
        throw new Error(data.error || "Fehler beim Login");
      }

      if (data.token) {
        localStorage.setItem("user", JSON.stringify(data));
        window.location.href = "/";
      } else {
        errorText.innerText = "Fehler: Ungültige Antwort vom Server";
      }
    } catch (error) {
      errorText.innerText = error.message;
    }
  });
});
