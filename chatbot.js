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
}

function getBotReply(message) {
  const msg = message.toLowerCase();
  if (msg.includes("hello") || msg.includes("hi")) return "Hello there!";
  if (msg.includes("how are you")) return "I'm just code, but I'm good!";
  if (msg.includes("bye")) return "Goodbye!";
  return "I didn't understand that. Try saying 'hello' or 'bye'.";
}
