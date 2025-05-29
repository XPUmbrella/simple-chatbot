// Simple chatbot logic with speech synthesis (only bot's reply is spoken)

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');

function getBotResponse(input) {
    const msg = input.trim().toLowerCase();
    if (msg.includes("hello") || msg.includes("hi")) return "Hello! How can I help you today?";
    if (msg.includes("name")) return "I'm your simple chatbot! 🤖";
    if (msg.includes("help")) return "You can say hello, ask my name, or just chat with me!";
    if (msg.includes("how are you")) return "I'm just code, but I'm happy to chat! How are you?";
    if (msg.includes("bye")) return "Goodbye! Have a great day!";
    // New responses below
    if (msg.includes("joke")) return "Why did the developer go broke? Because he used up all his cache!";
    if (msg.includes("thank")) return "You're welcome! 😊";
    if (msg.includes("weather")) return "Sorry, I can't check the weather yet!";
    // New time response
    if (msg.includes("time")) {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        return `The current time is ${timeString}.`;
    if (msg.includes("creator")) return "I was created by XPUmbrella!";
    return "I'm not sure how to answer that. Try asking something else!";
}

function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    msgDiv.textContent = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    if (sender === 'bot') {
        speakText(text); // Speak only the bot's response
    }
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop any ongoing speech
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
    appendMessage('user', input); // Show user input, but do not speak
    const response = getBotResponse(input);
    setTimeout(() => appendMessage('bot', response), 500); // Bot reply is shown and spoken
    userInput.value = '';
});
