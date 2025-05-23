// chatbot.js
// Simple chatbot using Hugging Face Inference API with error handling for 404

// Use a model that is available for public inference.
// As of 2025, facebook/blenderbot-400M-distill is generally available.
// If you get a 404, you can use a more general text-generation model like gpt2.
const API_URL = "https://api-inference.huggingface.co/models/gpt2"; // fallback to gpt2 for demo

// INSERT YOUR HUGGING FACE API KEY BELOW
const API_KEY = "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"; // <-- Replace with your Hugging Face API Key

// DOM elements
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatArea = document.getElementById("chat-area");
const loading = document.getElementById("loading");

// Append message to chat UI
function appendMessage(sender, message) {
  const div = document.createElement("div");
  div.className = sender;
  div.textContent = message;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// Show loading indicator
function showLoading() {
  if (loading) loading.style.display = "block";
}

// Hide loading indicator
function hideLoading() {
  if (loading) loading.style.display = "none";
}

// Handle form submit
chatForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;
  appendMessage("user", userMessage);
  chatInput.value = "";
  sendToBot(userMessage);
});

// Send message to Hugging Face API
function sendToBot(text) {
  showLoading();
  fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  })
    .then(async (res) => {
      hideLoading();
      if (!res.ok) {
        let errorMsg = `Error: ${res.status}`;
        if (res.status === 404) {
          errorMsg = "The chatbot model is unavailable (404). Please check the API URL or use another model.";
        }
        // Try to parse error message from response
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
      // For gpt2 or similar models, check for generated_text or array
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

// Optional: Send on Enter (if not handled by the form)
chatInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm.dispatchEvent(new Event("submit"));
  }
});

// On load, greet the user
window.addEventListener("DOMContentLoaded", function () {
  appendMessage("bot", "Hello! I'm your chatbot. How can I help you?");
});
