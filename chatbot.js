// chatbot.js
// Simple web chatbot using Hugging Face Inference API

const API_URL = "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill";
// If you have your own endpoint or want to use another model, replace the above URL.

const API_KEY = "YOUR_HF_API_KEY"; // <-- Replace with your Hugging Face API Key

// Elements
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatArea = document.getElementById('chat-area');
const loading = document.getElementById('loading');

// Helper: add message to chat
function appendMessage(sender, message) {
  const div = document.createElement('div');
  div.className = sender;
  div.textContent = message;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// Start loading animation
function showLoading() {
  if (loading) loading.style.display = 'block';
}

// Stop loading animation
function hideLoading() {
  if (loading) loading.style.display = 'none';
}

// Handle submitting message
chatForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;
  appendMessage('user', userMessage);
  chatInput.value = '';
  sendToBot(userMessage);
});

function sendToBot(text) {
  showLoading();
  fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ inputs: text })
  })
  .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
  .then(data => {
    // The Hugging Face API can return either an array or an object
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
    appendMessage('bot', botReply);
    hideLoading();
  })
  .catch(error => {
    hideLoading();
    appendMessage('error', `Error: ${error.error || error.message || error}`);
  });
}

// Optional: Allow sending with Enter key (if not already handled by your form)
chatInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm.dispatchEvent(new Event('submit'));
  }
});

// Optional: On page load, greet the user
window.addEventListener('DOMContentLoaded', function() {
  appendMessage('bot', "Hello! I'm your chatbot. How can I help you?");
});
