document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const textInput = document.getElementById('text-input');
    const sendButton = document.getElementById('send-button');
    const voiceButton = document.getElementById('voice-button');
    const transcriptionStatus = document.getElementById('transcription-status');

    // --- Speech Recognition Setup ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isRecording = false;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false; // Process single utterances
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            isRecording = true;
            voiceButton.textContent = '🛑 Stop';
            voiceButton.classList.add('recording');
            transcriptionStatus.textContent = 'Listening...';
        };

        recognition.onspeechend = () => {
            recognition.stop();
            isRecording = false;
            voiceButton.textContent = '🎤 Speak';
            voiceButton.classList.remove('recording');
            transcriptionStatus.textContent = 'Processing...';
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            transcriptionStatus.textContent = `Heard: ${transcript}`;
            textInput.value = transcript; // Put transcribed text into input field
            sendMessage(transcript); // Or send directly: sendMessage(transcript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            transcriptionStatus.textContent = `Error: ${event.error}`;
            if (event.error === 'no-speech') {
                transcriptionStatus.textContent = 'No speech detected. Please try again.';
            } else if (event.error === 'audio-capture') {
                transcriptionStatus.textContent = 'Audio capture error. Ensure microphone is enabled.';
            } else if (event.error === 'not-allowed') {
                transcriptionStatus.textContent = 'Microphone access denied. Please allow microphone access.';
            }
            isRecording = false;
            voiceButton.textContent = '🎤 Speak';
            voiceButton.classList.remove('recording');
        };
        
        recognition.onend = () => {
            if (isRecording) { // If ended prematurely by something other than onspeechend
                isRecording = false;
                voiceButton.textContent = '🎤 Speak';
                voiceButton.classList.remove('recording');
                if (transcriptionStatus.textContent === 'Listening...' || transcriptionStatus.textContent === 'Processing...') {
                    transcriptionStatus.textContent = 'Recording stopped.';
                }
            }
        };

    } else {
        voiceButton.disabled = true;
        transcriptionStatus.textContent = "Speech recognition not supported in this browser.";
    }

    voiceButton.addEventListener('click', () => {
        if (!SpeechRecognition) return;
        if (isRecording) {
            recognition.stop();
        } else {
            try {
                recognition.start();
            } catch (e) {
                console.error("Error starting recognition: ", e);
                transcriptionStatus.textContent = "Could not start voice recognition. Is microphone ready?";
            }
        }
    });

    // --- Sending Messages ---
    sendButton.addEventListener('click', () => {
        const messageText = textInput.value.trim();
        if (messageText) {
            sendMessage(messageText);
            textInput.value = '';
        }
    });

    textInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            const messageText = textInput.value.trim();
            if (messageText) {
                sendMessage(messageText);
                textInput.value = '';
            }
        }
    });

    async function sendMessage(messageText) {
        if (!messageText) return;

        addMessageToChatBox(messageText, 'user');
        transcriptionStatus.textContent = ""; // Clear status after sending

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: messageText }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.reply || `Server error: ${response.status}`);
            }

            const data = await response.json();
            const botReply = data.reply;
            addMessageToChatBox(botReply, 'bot');
            speakResponse(botReply); // Speak the bot's response

        } catch (error) {
            console.error('Error sending message:', error);
            addMessageToChatBox(`Error: ${error.message}`, 'bot', true);
        }
    }

    function addMessageToChatBox(text, sender, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender + '-message');
        if (isError) {
            messageDiv.classList.add('error');
        }
        messageDiv.textContent = text;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom
    }

    // --- Text-to-Speech for Bot Responses ---
    function speakResponse(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            // Optional: Configure voice, rate, pitch
            // const voices = speechSynthesis.getVoices();
            // utterance.voice = voices.find(voice => voice.lang === 'en-US'); // Example
            // utterance.pitch = 1;
            // utterance.rate = 1;
            speechSynthesis.speak(utterance);
        } else {
            console.warn("Speech synthesis not supported in this browser.");
        }
    }
});
