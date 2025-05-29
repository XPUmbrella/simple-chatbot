// Smarter local chatbot: remembers Q&A pairs, does fuzzy matching, speaks replies

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');

const memory = []; // {user: "...", bot: "..."}

function getSimilarity(str1, str2) {
  // Jaccard similarity over words
  const set1 = new Set(str1.toLowerCase().split(/\W+/));
  const set2 = new Set(str2.toLowerCase().split(/\W+/));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size || 0;
}

function getBotResponse(input) {
  const msg = input.trim().toLowerCase();

  // Rule-based responses
  if (msg.includes("hello") || msg.includes("hi")) return "Hello! How can I help you today?";
  if (msg.includes("name")) return "I'm your learning chatbot!";
  if (msg.includes("help")) return "You can say hello, ask my name, or just chat with me!";
  if (msg.includes("how are you")) return "I'm just code, but I'm happy to chat! How are you?";
  if (msg.includes("bye")) return "Goodbye! Have a great day!";

  // Fuzzy match: look for similar past user questions
  let bestMatch = null, bestScore = 0.5; // threshold
  for (let entry of memory) {
    const score = getSimilarity(msg, entry.user.toLowerCase());
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }
  if (bestMatch) {
    return `Earlier you asked something like "${bestMatch.user}". My reply was: "${bestMatch.bot}"`;
  }

  // If not recognized, remember it and say it back next time
  return "I'm not sure how to answer that yet, but I'll remember you said: \"" + input + "\"";
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

  // Store user message
  const response = getBotResponse(input);
  memory.push({ user: input, bot: response });

  setTimeout(() => appendMessage('bot', response), 500);
  userInput.value = '';
});
