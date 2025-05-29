// Simple, extensible chatbot with voice + text input, in-browser code learning

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const micBtn = document.getElementById('mic-btn');

// Q&A memory and custom logic
const memory = [];
const customLogic = []; // {trigger, type: 'reply'|'code', value}

// For teaching the bot new things
let awaitingAnswer = null;

// Speech recognition setup
let recognition, recognizing = false;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    recognizing = true;
    micBtn.classList.add('listening');
    userInput.placeholder = "Listening...";
  };
  recognition.onend = () => {
    recognizing = false;
    micBtn.classList.remove('listening');
    userInput.placeholder = "Type or hold 🎤 to speak...";
  };
  recognition.onerror = (e) => {
    recognizing = false;
    micBtn.classList.remove('listening');
    userInput.placeholder = "Type or hold 🎤 to speak...";
  };
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    userInput.value = transcript;
    chatForm.requestSubmit();
  };
}

// Fuzzy matching (simple, for learning)
function getSimilarity(a, b) {
  const wa = new Set(a.toLowerCase().split(/\W+/));
  const wb = new Set(b.toLowerCase().split(/\W+/));
  const intersection = new Set([...wa].filter(x => wb.has(x)));
  const union = new Set([...wa, ...wb]);
  return intersection.size / (union.size || 1);
}
function findBestMatch(question, arr, key='question', threshold=0.5) {
  let best = null, bestScore = threshold;
  for (const item of arr) {
    const score = getSimilarity(question, item[key]);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}

// Main bot logic
function getBotResponse(input) {
  const msg = input.trim();

  // Learn new answer if prompted
  if (awaitingAnswer) {
    memory.push({ question: awaitingAnswer, answer: msg });
    awaitingAnswer = null;
    return `Thank you! I'll remember that "${memory[memory.length-1].question}" means "${msg}".`;
  }

  // Handle add: commands to inject new logic
  if (/^add:when i hear "(.+?)", *reply with "([\s\S]+?)"$/i.test(msg)) {
    const [, trigger, response] = msg.match(/^add:when i hear "(.+?)", *reply with "([\s\S]+?)"$/i);
    customLogic.push({ trigger, type: 'reply', value: response });
    return `Added rule: When I hear "${trigger}", I'll reply with "${response}"`;
  }
  if (/^add:when i hear "(.+?)", *run: *([\s\S]+)$/i.test(msg)) {
    const [, trigger, code] = msg.match(/^add:when i hear "(.+?)", *run: *([\s\S]+)$/i);
    customLogic.push({ trigger, type: 'code', value: code });
    return `Added code: When I hear "${trigger}", I'll run your code.`;
  }

  // Custom logic (user code or reply)
  const custom = findBestMatch(msg, customLogic, 'trigger', 0.65);
  if (custom) {
    if (custom.type === 'reply') return custom.value;
    if (custom.type === 'code') {
      try {
        // The code can use the variable 'input'
        // eslint-disable-next-line no-new-func
        const func = new Function("input", custom.value);
        return String(func(msg));
      } catch (e) {
        return "Sorry, your code caused an error: " + e.message;
      }
    }
  }

  // Built-in responses
  const low = msg.toLowerCase();
  if (low.includes("hello") || low.includes("hi")) return "Hello! How can I help you today?";
  if (low.includes("name")) return "I'm your simple chatbot!";
  if (low.includes("help")) return 'You can chat, or teach me: "add:when I hear \\"something\\", reply with \\"something\\"" or "add:when I hear \\"something\\", run: <js code>". If I don\'t know an answer, just tell me!';
  if (low.includes("how are you")) return "I'm just code, but I'm happy to chat! How are you?";
  if (low.includes("bye")) return "Goodbye! Have a great day!";

  // Learned responses
  const best = findBestMatch(msg, memory, 'question', 0.5);
  if (best) return best.answer;

  // Ask user to teach
  awaitingAnswer = msg;
  return `I don't know how to respond to "${msg}". What should I reply if someone asks me that?`;
}

function appendMessage(sender, text) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', sender);
  msgDiv.textContent = text;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
  if (sender === 'bot') speakText(text);
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
  const input = userInput.value.trim();
  if (!input) return;
  appendMessage('user', input);
  const response = getBotResponse(input);
  setTimeout(() => appendMessage('bot', response), 400);
  userInput.value = '';
});

// Voice input button handlers
if (recognition) {
  micBtn.addEventListener('mousedown', () => {
    if (!recognizing) recognition.start();
  });
  micBtn.addEventListener('mouseup', () => {
    if (recognizing) recognition.stop();
  });
  micBtn.addEventListener('mouseleave', () => {
    if (recognizing) recognition.stop();
  });
  micBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!recognizing) recognition.start();
  }, {passive: false});
  micBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (recognizing) recognition.stop();
  }, {passive: false});
} else {
  micBtn.style.display = 'none';
}

// Greet on load
setTimeout(() => appendMessage('bot', "Hi! I'm a simple chatbot. Type or hold 🎤 to speak. Type 'help' for instructions."), 400);
