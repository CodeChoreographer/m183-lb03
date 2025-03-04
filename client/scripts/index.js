document.addEventListener("DOMContentLoaded", () => {
  const newTweetInput = document.getElementById("new-tweet");
  const postTweetButton = document.getElementById("post-tweet");
  const logoutButton = document.getElementById("logout");
  const tweetErrorBox = document.getElementById("tweet-error-box");
  const tweetSuccessBox = document.getElementById("tweet-success-box");
  const feedContainer = document.getElementById("feed");

  const user = JSON.parse(sessionStorage.getItem("user")); 
  if (!user) {
    window.location.href = "/login.html";
  }

  const showError = (message) => {
    tweetErrorBox.textContent = message;
    tweetErrorBox.style.display = "block";
    tweetSuccessBox.style.display = "none";
  };

  const showSuccess = (message) => {
    tweetSuccessBox.textContent = message;
    tweetSuccessBox.style.display = "block";
    tweetErrorBox.style.display = "none";
    setTimeout(() => {
      tweetSuccessBox.style.display = "none";
    }, 3000);
  };

  const clearMessages = () => {
    tweetErrorBox.style.display = "none";
    tweetSuccessBox.style.display = "none";
  };

  const getFeed = async () => {
    try {
      const response = await fetch(`/api/feed`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Fehler beim Abrufen der Tweets");
      }

      const tweets = await response.json();
      if (!tweets || tweets.length === 0) {
        feedContainer.innerHTML = "<p class='text-gray-400 text-center'>Keine Tweets vorhanden</p>";
        return;
      }

      feedContainer.innerHTML = tweets.map((tweet) => generateTweet(tweet)).join("");
    } catch (error) {
      console.error("Fehler beim Abrufen des Feeds:", error);
      showError("Tweets konnten nicht geladen werden.");
    }
  };

  const postTweet = async () => {
    clearMessages();

    const text = newTweetInput.value.trim();
    if (!text) {
      showError("Tweet darf nicht leer sein!");
      return;
    }

    try {
      const response = await fetch("/api/feed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const data = await response.json();
        showError(data.error);
        return;
      }

      await getFeed();
      newTweetInput.value = "";
      showSuccess("✅ Tweet erfolgreich gepostet!");
    } catch (error) {
      console.error("Fehler beim Posten des Tweets:", error);
      showError("Tweet konnte nicht gepostet werden.");
    }
  };

  const generateTweet = (tweet) => {
    const date = new Date(tweet.timestamp).toLocaleDateString("de-CH", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });

    return `
      <div class="flex flex-col gap-2 w-full">
        <div class="bg-slate-600 rounded p-4 flex gap-4 items-center border-l-4 border-blue-400">
          <img src="./img/tweet.png" alt="User" class="w-14 h-14 rounded-full" />
          <div class="flex flex-col grow">
            <div class="flex justify-between text-gray-200">
              <h3 class="font-semibold">${tweet.username}</h3>
              <p class="text-sm">${date}</p>
            </div>
            <p>${tweet.text}</p>
          </div>
        </div>
      </div>`;
  };

  postTweetButton.addEventListener("click", postTweet);
  newTweetInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      postTweet();
    }
  });

  newTweetInput.addEventListener("input", clearMessages);
  logoutButton.addEventListener("click", () => {
    sessionStorage.clear(); 
    window.location.href = "/login.html";
  });

  getFeed();
});
