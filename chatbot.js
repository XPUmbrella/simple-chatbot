const API_URL = "https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct";
const API_KEY = "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"; // Replace with your key

const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatArea = document.getElementById("chat-area");
const loading = document.getElementById("loading");

function appendMessage(sender, message) {
  const div = document.createElement("div");
  div.className = sender;
  div.textContent = message;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function showLoading() {
  if (loading) loading.style.display = "block";
}
function hideLoading() {
  if (loading) loading.style.display = "none";
}

chatForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;
  appendMessage("user", userMessage);
  chatInput.value = "";
  sendToBot(userMessage);
});

function sendToBot(text) {
  showLoading();
  fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text })
  })
    .then(async (res) => {
      hideLoading();
      if (!res.ok) {
        let errorMsg = `Error: ${res.status}`;
        if (res.status === 404) {
          errorMsg = "The chatbot model is unavailable (404). Please check the API URL or use another model.";
        } else if (res.status === 401 || res.status === 403) {
          errorMsg = "Invalid or missing Hugging Face API key.";
        }
        try {
          const errJson = await res.json();
          if (errJson.error) errorMsg += `\n${errJson.error}`;
        } catch {}
        appendMessage("error", errorMsg);
        return;
      }
      return res.json();
    })
    .then((data) => {
      if (!data) return;
      let botReply = "";
      if (Array.isArray(data) && data[0] && data[0].generated_text) {
        botReply = data[0].generated_text;
      } else if (data.generated_text) {
        botReply = data.generated_text;
      } else if (data.error) {
        botReply = `Error: ${data.error}`;
      } else {
        botReply = "Sorry, I couldn't understand that.";
      }
      appendMessage("bot", botReply.trim());
    })
    .catch((error) => {
      hideLoading();
      appendMessage("error", `Network or server error: ${error.message || error}`);
    });
}

chatInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm.dispatchEvent(new Event("submit"));
  }
});

window.addEventListener("DOMContentLoaded", function () {
  appendMessage("bot", "Hello! I'm your chatbot. How can I help you?");
});
