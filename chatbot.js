// Minimal chatbot: bot response is always spoken

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');

function getBotResponse(input) {
  const msg = input.trim().toLowerCase();
  if (msg.includes("hello") || msg.includes("hi")) return "Hello! How can I help you today?";
  if (msg.includes("name")) return "I'm your simple chatbot!";
  if (msg.includes("help")) return "You can say hello, ask my name, or just chat with me!";
  if (msg.includes("how are you")) return "I'm just code, but I'm happy to chat! How are you?";
  if (msg.includes("bye")) return "Goodbye! Have a great day!";
  return "I'm not sure how to answer that. Try asking something else!";
}

function appendMessage(sender, text) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', sender);
  msgDiv.textContent = text;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
  if (sender === 'bot') {
    speakText(text);
  }
}

function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 1;
    utter.pitch = 1;
    utter.volume = 1;
    window.speechSynthesis.speak(utter);
  }
}

chatForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const input = userInput.value;
  appendMessage('user', input);
  const response = getBotResponse(input);
  setTimeout(() => appendMessage('bot', response), 500);
  userInput.value = '';
});
