document.addEventListener("DOMContentLoaded", () => {
  const newTweetInput = document.getElementById("new-tweet");
  const postTweetButton = document.getElementById("post-tweet");
  const logoutButton = document.getElementById("logout");

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "/login.html";
  }

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
      
      // Falls keine Tweets vorhanden sind
      if (!tweets || tweets.length === 0) {
        document.getElementById("feed").innerHTML =
          "<p class='text-gray-400 text-center'>Keine Tweets vorhanden</p>";
        return;
      }

      document.getElementById("feed").innerHTML = tweets.map(generateTweet).join("");
    } catch (error) {
      console.error("Fehler beim Abrufen des Feeds:", error);
      document.getElementById("feed").innerHTML =
        "<p class='text-red-500 text-center'>Fehler beim Laden der Tweets</p>";
    }
  };

  const postTweet = async () => {
    const text = newTweetInput.value.trim();
    if (!text) return alert("Tweet darf nicht leer sein!");

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
        throw new Error("Fehler beim Posten des Tweets");
      }

      await getFeed();
      newTweetInput.value = "";
    } catch (error) {
      console.error("Fehler beim Posten des Tweets:", error);
      alert("Tweet konnte nicht gepostet werden.");
    }
  };

  postTweetButton.addEventListener("click", postTweet);
  newTweetInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      postTweet();
    }
  });

  logoutButton.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "/login.html";
  });

  getFeed();
});
