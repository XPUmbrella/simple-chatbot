// Simple "learning" chatbot: remembers conversation, speaks, no third-party libs

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');

// Memory of previous conversation (in this session)
const memory = [];

// Basic rule-based bot with memory
function getBotResponse(input) {
  const msg = input.trim().toLowerCase();
  // Rule-based responses
  if (msg.includes("hello") || msg.includes("hi")) return "Hello! How can I help you today?";
  if (msg.includes("name")) return "I'm your learning chatbot!";
  if (msg.includes("help")) return "You can say hello, ask my name, or just chat with me!";
  if (msg.includes("how are you")) return "I'm just code, but I'm happy to chat! How are you?";
  if (msg.includes("bye")) return "Goodbye! Have a great day!";
  // "Learns" by recalling what user said earlier
  for (let entry of memory.slice(-5).reverse()) {
    if (msg === entry.user.toLowerCase()) {
      return "You already asked that! Last time you said: " + entry.user;
    }
  }
  // If it can't answer, it "remembers" the question for future
  return "I'm not sure how to answer that yet, but I'll remember you said: '" + input + "'";
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
  // Store in memory
  memory.push({ user: input });
  const response = getBotResponse(input);
  setTimeout(() => appendMessage('bot', response), 500);
  userInput.value = '';
});
