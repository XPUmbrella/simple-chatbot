function speakText(text) {
  if (typeof text !== 'string' || !text.trim()) return;

  if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
    window.speechSynthesis.cancel();
  }

  const utterance = new window.SpeechSynthesisUtterance(text);

  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event.error);
  };

  window.speechSynthesis.speak(utterance);
}
function sendMessage() {
  const input = document.getElementById("userInput");
  const chatlog = document.getElementById("chatlog");
  const userText = input.value.trim();

  if (!userText) return;

  const botReply = getBotReply(userText);
  chatlog.innerHTML += `<div><strong>You:</strong> ${userText}</div>`;
  chatlog.innerHTML += `<div><strong>Bot:</strong> ${botReply}</div>`;
  input.value = "";
  chatlog.scrollTop = chatlog.scrollHeight;
  const utter = new SpeechSynthesisUtterance(botReply);
speechSynthesis.speak(utter);}

function getBotReply(message) {
  const msg = message.toLowerCase();
  if (msg.includes("hello") || msg.includes("hi")) return "Hello there!";
  if (msg.includes("how are you")) return "I'm just code, but I'm good!";
  if (msg.includes("bye")) return "Goodbye!";
  return "I didn't understand that. Try saying 'hello' or 'bye'.";
}
document.getElementById("userInput").addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault(); // prevent form submission (if any)
    sendMessage();
  }
  function startListening() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  recognition.onresult = function(event) {
    document.getElementById("userInput").value = event.results[0][0].transcript;
    sendMessage();
  };
  recognition.start();
}});
