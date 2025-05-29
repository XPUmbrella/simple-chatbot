// Simple rule-based chatbot logic

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');

// Simple responses (feel free to expand!)
function getBotResponse(input) {
    const msg = input.trim().toLowerCase();
    if (msg.includes("hello") || msg.includes("hi")) return "Hello! How can I help you today?";
    if (msg.includes("name")) return "I'm your simple chatbot! 🤖";
    if (msg.includes("help")) return "You can say hello, ask my name, or just chat with me!";
    if (msg.includes("how are you")) return "I'm just code, but I'm happy to chat! How are you?";
    if (msg.includes("bye")) return "Goodbye! Have a great day!";
    // Default fallback
    return "I'm not sure how to answer that. Try asking something else!";
}

// Append a message to the chat box
function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    msgDiv.textContent = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Handle user input
chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const input = userInput.value;
    appendMessage('user', input);
    const response = getBotResponse(input);
    setTimeout(() => appendMessage('bot', response), 500);
    userInput.value = '';
});
