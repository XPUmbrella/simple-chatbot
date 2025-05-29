document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    function sendMessage() {
        const messageText = userInput.value.trim();
        if (messageText === '') {
            return;
        }

        addMessageToChatBox(messageText, 'user');
        userInput.value = ''; // Clear input field

        // Get bot response
        const botResponse = getBotResponse(messageText);
        // Simulate a small delay for bot response
        setTimeout(() => {
            addMessageToChatBox(botResponse, 'bot');
        }, 500);
    }

    function addMessageToChatBox(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender + '-message');
        messageDiv.textContent = text;
        chatBox.appendChild(messageDiv);
        // Scroll to the bottom of the chat box
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function getBotResponse(userText) {
        const lowerUserText = userText.toLowerCase();

        if (lowerUserText.includes('hello') || lowerUserText.includes('hi')) {
            return 'Hi there!';
        } else if (lowerUserText.includes('how are you')) {
            return "I'm doing well, thanks for asking!";
        } else if (lowerUserText.includes('what is your name')) {
            return "I'm a simple chatbot.";
        } else if (lowerUserText.includes('bye')) {
            return "Goodbye! Have a nice day!";
        } else {
            // Simple echo for anything not recognized, to make it slightly more interactive than a fixed "I don't understand"
            // For a more traditional "I don't understand", use:
            // return "Sorry, I didn't understand that. I can only respond to a few phrases like 'hello', 'how are you', 'what is your name', or 'bye'.";
            return "You said: '" + userText + "'. I am a simple bot with limited responses.";
        }
    }

    // Optional: Add a welcome message from the bot when the chat loads
    setTimeout(() => {
        addMessageToChatBox("Hello! I'm a simple chatbot. Try saying 'hello' or 'how are you'.", 'bot');
    }, 200);
});
