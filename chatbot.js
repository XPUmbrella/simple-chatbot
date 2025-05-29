// "Smarter" local chatbot: learns Q&A pairs, fuzzy matches, asks for answers, speaks

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');

// In-memory Q&A database
const memory = []; // {question: "...", answer: "..."}

let awaitingAnswer = null; // Tracks if bot is waiting for user's answer to a question

function getSimilarity(a, b) {
  // Jaccard similarity over words
  const wa = new Set(a.toLowerCase().split(/\W+/));
  const wb = new Set(b.toLowerCase().split(/\W+/));
  const intersection = new Set([...wa].filter(x => wb.has(x)));
  const union = new Set([...wa, ...wb]);
  return intersection.size / (union.size || 1);
}

function findBestMatch(question) {
  let best = null, bestScore = 0.5; // similarity threshold
  for (const pair of memory) {
    const score = getSimilarity(question, pair.question);
    if (score > bestScore) {
      bestScore = score;
      best = pair;
    }
  }
  return best;
}

function getBotResponse(input) {
  const msg = input.trim();

  // If bot is waiting for answer to last unknown question
  if (awaitingAnswer) {
    memory.push({ question: awaitingAnswer, answer: msg });
    const reply = `Thank you! I'll remember that "${awaitingAnswer}" means "${msg}".`;
    awaitingAnswer = null;
    return reply;
  }

  // Built-in simple responses
  const low = msg.toLowerCase();
  if (low.includes("hello") || low.includes("hi")) return "Hello! How can I help you today?";
  if (low.includes("name")) return "I'm your learning chatbot!";
  if (low.includes("help")) return "You can say hello, ask my name, or just chat with me!";
  if (low.includes("how are you")) return "I'm just code, but I'm happy to chat! How are you?";
  if (low.includes("bye")) return "Goodbye! Have a great day!";

  // Look for best match in memory
  const best = findBestMatch(msg);
  if (best) {
    return best.answer;
  }

  // If not known, ask user to teach
  awaitingAnswer = msg;
  return `I don't know how to respond to "${msg}". What should I reply if someone asks me that?`;
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
