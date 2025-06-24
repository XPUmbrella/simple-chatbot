function sendMessage() {
  const userInput = document.getElementById('user-input').value;
  if (!userInput) return;

  // Display user message
  const chatBox = document.getElementById('chat-box');
  chatBox.innerHTML += `<div class="user-message">You: ${userInput}</div>`;

  // Simple bot reply
  const replies = ["Hello!", "How can I help?", "Interesting!", "Thanks!"];
  const botReply = replies[Math.floor(Math.random() * replies.length)];
  chatBox.innerHTML += `<div class="bot-message">Bot: ${botReply}</div>`;

  // Clear input
  document.getElementById('user-input').value = '';
}
