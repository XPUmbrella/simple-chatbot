
// ======================
// CORE SETUP
// ======================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = 'en-US';

const synth = window.speechSynthesis;
let currentUtterance = null;
let isListening = false;
let lastBotResponse = "";
let lastSpeechTime = 0;
const speechDelay = 2000; // 2 seconds between speeches

// DOM elements
const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const micButton = document.getElementById('micButton');
const statusElement = document.getElementById('status');
const typingIndicator = document.getElementById('typing-indicator');
const memoryModal = document.getElementById('memoryModal');
const memoryList = document.getElementById('memoryList');
const fileInput = document.getElementById('fileInput');
const tabMemories = document.getElementById('tabMemories');
const tabAchievements = document.getElementById('tabAchievements');
const memoriesContent = document.getElementById('memoriesContent');
const achievementsContent = document.getElementById('achievementsContent');


// Initialize memory systems
if (!localStorage.getItem('chatbotMemory')) {
    localStorage.setItem('chatbotMemory', JSON.stringify({}));
}
if (!localStorage.getItem('chatHistory')) {
    localStorage.setItem('chatHistory', JSON.stringify([]));
}
if (!localStorage.getItem('chatbotDefinitions')) {
    localStorage.setItem('chatbotDefinitions', JSON.stringify({}));
}

// Conversation context
let conversationContext = {
    lastTopic: null,
    lastEntities: {}
};

// Voice settings
let voiceRate = parseFloat(localStorage.getItem('voiceRate')) || 1;
let voicePitch = parseFloat(localStorage.getItem('voicePitch')) || 1;
let speakBotResponsesAutomatically = localStorage.getItem('speakBotResponsesAutomatically') === 'true';
let speakUserMessagesOnSend = localStorage.getItem('speakUserMessagesOnSend') === 'true';


// ======================
// SETTINGS SYSTEM
// ======================
let botName = localStorage.getItem('botName') || "Assistant";
let selectedVoice = null;

function initSettings() {
    // Toggle settings panel
    document.querySelector('.settings-btn').addEventListener('click', function() {
        const panel = document.querySelector('.settings-panel');
        panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    });

    // Bot name setting
    const botNameInput = document.getElementById('botNameInput');
    botNameInput.value = botName;
    botNameInput.addEventListener('change', function() {
        botName = this.value || "Assistant";
        localStorage.setItem('botName', botName);
        updateChatHeader();
    });

    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    darkModeToggle.checked = localStorage.getItem('darkMode') === 'true';
    updateDarkMode();

    darkModeToggle.addEventListener('change', function() {
        localStorage.setItem('darkMode', this.checked);
        updateDarkMode();
        // Achievement trigger for Dark Mode
        checkAchievement('darkKnight');
    });

    // Voice selection
    populateVoiceList();
    document.getElementById('voiceSelect').addEventListener('change', function() {
        const voiceName = this.value;
        const voices = synth.getVoices();
        selectedVoice = voices.find(v => v.name === voiceName);
        localStorage.setItem('selectedVoice', voiceName);
    });

    // Voice rate control
    const voiceRateInput = document.getElementById('voiceRate');
    voiceRateInput.value = voiceRate;
    document.getElementById('rateValue').textContent = voiceRate;
    voiceRateInput.addEventListener('input', function() {
        voiceRate = parseFloat(this.value);
        document.getElementById('rateValue').textContent = voiceRate;
        localStorage.setItem('voiceRate', voiceRate);
    });

    // Voice pitch control
    const voicePitchInput = document.getElementById('voicePitch');
    voicePitchInput.value = voicePitch;
    document.getElementById('pitchValue').textContent = voicePitch;
    voicePitchInput.addEventListener('input', function() {
        voicePitch = parseFloat(this.value);
        document.getElementById('pitchValue').textContent = voicePitch;
        localStorage.setItem('voicePitch', voicePitch);
    });

    // Voice selection is now primarily handled by `onvoiceschanged` and `populateVoiceList`
    // to ensure voices are loaded before selection.

    // Auto Speak Bot Responses toggle
    const autoSpeakBotToggle = document.getElementById('autoSpeakBotToggle');
    autoSpeakBotToggle.checked = speakBotResponsesAutomatically;
    autoSpeakBotToggle.addEventListener('change', function() {
        speakBotResponsesAutomatically = this.checked;
        localStorage.setItem('speakBotResponsesAutomatically', this.checked);
    });

    // Speak User Messages on Send toggle
    const speakUserMsgToggle = document.getElementById('speakUserMsgToggle');
    speakUserMsgToggle.checked = speakUserMessagesOnSend;
    speakUserMsgToggle.addEventListener('change', function() {
        speakUserMessagesOnSend = this.checked;
        localStorage.setItem('speakUserMessagesOnSend', this.checked);
    });
}

function updateDarkMode() {
    const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
    document.body.classList.toggle('dark-mode', darkModeEnabled);
}

function updateChatHeader() {
    document.querySelector('.chat-header #chatBotName').textContent = `${botName}`; // Updated selector
}

function populateVoiceList() {
    const voiceSelect = document.getElementById('voiceSelect');
    voiceSelect.innerHTML = '';

    // Default option
    const defaultOption = document.createElement('option');
    defaultOption.textContent = 'Select a voice';
    defaultOption.value = '';
    voiceSelect.appendChild(defaultOption);

    // Get all available voices
    const voices = synth.getVoices();

    // Try to find British voices first
    const britishVoices = voices.filter(v => v.lang.includes('en-GB'));
    const otherEnglishVoices = voices.filter(v => v.lang.includes('en-') && !v.lang.includes('en-GB'));

    // Add British voices first
    if (britishVoices.length > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = 'British Voices';
        britishVoices.forEach(voice => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.value = voice.name;
            optgroup.appendChild(option);

            // Prefer British male voices
            if (voice.name.includes('Male') || voice.name.includes('George')) {
                option.selected = true;
                selectedVoice = voice;
            }
        });
        voiceSelect.appendChild(optgroup);
    }

    // Add other English voices
    if (otherEnglishVoices.length > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = 'Other English Voices';
        otherEnglishVoices.forEach(voice => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.value = voice.name;
            optgroup.appendChild(option);
        });
        voiceSelect.appendChild(optgroup);
    }

    // After populating, try to set the saved voice
    const savedVoiceName = localStorage.getItem('selectedVoice');
    if (savedVoiceName) {
        const allVoices = synth.getVoices(); // Get fresh list
        const voiceToSelect = allVoices.find(v => v.name === savedVoiceName);
        if (voiceToSelect) {
            voiceSelect.value = savedVoiceName;
            selectedVoice = voiceToSelect; // Update the global selectedVoice
        } else {
            // If saved voice not found, clear the invalid entry
            localStorage.removeItem('selectedVoice');
            selectedVoice = null;
        }
    }
    // If no saved voice or saved voice not found, and a default British Male was selected earlier,
    // ensure 'selectedVoice' variable matches the dropdown.
    if (!selectedVoice && voiceSelect.value) {
         const allVoices = synth.getVoices();
         selectedVoice = allVoices.find(v => v.name === voiceSelect.value);
    }

            // Add non-English voices if any
            const nonEnglishVoices = voices.filter(v => !v.lang.startsWith('en-'));
            if (nonEnglishVoices.length > 0) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = 'Other Languages';
                nonEnglishVoices.forEach(voice => {
                    const option = document.createElement('option');
                    option.textContent = `${voice.name} (${voice.lang})`;
                    option.value = voice.name;
                    optgroup.appendChild(option);
                });
                voiceSelect.appendChild(optgroup);
            }

            // If after all this, nothing is selected but there are voices, select the first one.
            if (!voiceSelect.value && voices.length > 0) {
                voiceSelect.selectedIndex = 0; // Select the "Select a voice" default
                // If a default like a British male was auto-selected, ensure selectedVoice var is updated
                if (voiceSelect.options[voiceSelect.selectedIndex].value) {
                     selectedVoice = voices.find(v => v.name === voiceSelect.options[voiceSelect.selectedIndex].value);
                } else {
                    selectedVoice = null; // No specific voice selected
                }
            }
}

// ======================
// DIGITAL CLOCK FUNCTIONS
// ======================
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    const dateStr = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Update regular clock
    document.getElementById('digitalClock').textContent = `${timeStr} | ${dateStr}`;

    // Update fullscreen clock if visible
    if (document.getElementById('fullscreenClock').style.display === 'flex') {
        document.getElementById('fsTime').textContent = timeStr;
        document.getElementById('fsDate').textContent = dateStr;
    }
}

function toggleFullscreenClock() {
    const fsClock = document.getElementById('fullscreenClock');
    fsClock.style.display = fsClock.style.display === 'none' ? 'flex' : 'none';
    updateClock(); // Force immediate update when toggling
}

// Initialize clock
setInterval(updateClock, 1000);
updateClock();

// Make clock clickable for fullscreen
document.getElementById('digitalClock').addEventListener('click', toggleFullscreenClock);
document.getElementById('fullscreenClock').addEventListener('click', toggleFullscreenClock);

// ======================
// MEMORY FUNCTIONS
// ======================
function rememberFact(key, value) {
    const memory = JSON.parse(localStorage.getItem('chatbotMemory'));
    memory[key] = value;
    localStorage.setItem('chatbotMemory', JSON.stringify(memory));
    respondToQuery(`Got it! I'll remember "${key}".`, true);

    // Also save to history
    saveToHistory("system", `Remembered: ${key} = ${value}`);
    // Achievement trigger for memory usage
    checkAchievement('memoryMaster');
}

function recallFact(key) {
    const memory = JSON.parse(localStorage.getItem('chatbotMemory'));
    return memory[key] || `I don't remember anything about "${key}".`;
}

function saveToHistory(sender, message) {
    const history = JSON.parse(localStorage.getItem('chatHistory'));
    history.push({
        sender,
        message,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('chatHistory', JSON.stringify(history));
}

function recallHistory(keyword) {
    const history = JSON.parse(localStorage.getItem('chatHistory'));
    return history.filter(entry =>
        entry.message.toLowerCase().includes(keyword.toLowerCase())
    );
}

function showAllMemories() {
    const memory = JSON.parse(localStorage.getItem('chatbotMemory'));
    memoryList.innerHTML = '';

    if (Object.keys(memory).length === 0) {
        memoryList.innerHTML = '<p>I don\'t remember anything yet.</p>';
    } else {
        for (const [key, value] of Object.entries(memory)) {
            const memoryItem = document.createElement('div');
            memoryItem.className = 'command-item';
            memoryItem.innerHTML = `
                <p><strong>${key}:</strong> ${value}</p>
                <button onclick="deleteMemory('${key}')">Forget</button>
            `;
            memoryList.appendChild(memoryItem);
        }
    }
    memoryModal.style.display = 'flex';
    // Ensure the correct tab content is visible when opening
    tabMemories.classList.add('active');
    tabAchievements.classList.remove('active');
    memoriesContent.style.display = 'block';
    achievementsContent.style.display = 'none';
}


function deleteMemory(key) {
    const memory = JSON.parse(localStorage.getItem('chatbotMemory'));
    delete memory[key];
    localStorage.setItem('chatbotMemory', JSON.stringify(memory));
    showAllMemories();
    respondToQuery(`I've forgotten about "${key}".`, true);
}

function clearAllMemories() {
    if (confirm("Are you sure you want to clear ALL memories? This will reset achievement progress too!")) {
        localStorage.setItem('chatbotMemory', JSON.stringify({}));
        localStorage.setItem('chatHistory', JSON.stringify([]));
        localStorage.setItem('chatbotDefinitions', JSON.stringify({}));
        // Reset achievements on clear all memories for a fresh start
        initializeAchievements(); // Re-initialize to default state
        displayAchievements(); // Update display
        respondToQuery("All memories and achievements have been cleared.", true);
    }
}

// ======================
// MEMORY IMPORT/EXPORT
// ======================
function downloadMemories() {
    const memory = JSON.parse(localStorage.getItem('chatbotMemory') || '{}');
    const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    const definitions = JSON.parse(localStorage.getItem('chatbotDefinitions') || '{}');
    const achievementsData = JSON.parse(localStorage.getItem('chatbotAchievements') || '[]');

    const data = {
        memory: memory,
        history: history,
        definitions: definitions, // Include definitions
        achievements: achievementsData, // Include achievements
        exportedAt: new Date().toISOString(),
        botName: botName,
        voice: selectedVoice ? selectedVoice.name : null,
        voiceRate: voiceRate,
        voicePitch: voicePitch,
        darkMode: localStorage.getItem('darkMode') || 'false',
        speakBotResponsesAutomatically: localStorage.getItem('speakBotResponsesAutomatically') || 'false',
        speakUserMessagesOnSend: localStorage.getItem('speakUserMessagesOnSend') || 'false'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatbot-memory-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    respondToQuery("Memories downloaded as JSON file.", true);
    checkAchievement('memoryMaster'); // Trigger achievement for download
}

function uploadMemories() {
    fileInput.click();
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            if (data.memory) {
                localStorage.setItem('chatbotMemory', JSON.stringify(data.memory));
            }
            if (data.history) {
                localStorage.setItem('chatHistory', JSON.stringify(data.history));
            }
            if (data.definitions) { // Import definitions
                localStorage.setItem('chatbotDefinitions', JSON.stringify(data.definitions));
            }
            if (data.achievements) { // Import achievements
                // Merge imported achievements, don't overwrite if existing progress is higher
                const importedAchievements = data.achievements;
                achievements.forEach(localAch => {
                    const importedAch = importedAchievements.find(ia => ia.id === localAch.id);
                    if (importedAch) {
                        if (importedAch.earned) {
                            localAch.earned = true;
                        }
                        if (importedAch.type === 'count' && importedAch.current > localAch.current) {
                            localAch.current = importedAch.current;
                        }
                    }
                });
                saveAchievements(); // Save the merged state
                displayAchievements(); // Update display
            }

            if (data.botName) {
                botName = data.botName;
                localStorage.setItem('botName', botName);
                document.getElementById('botNameInput').value = botName;
                updateChatHeader();
            }
            if (data.voice) {
                const voiceSelect = document.getElementById('voiceSelect');
                voiceSelect.value = data.voice;
                const voices = synth.getVoices();
                selectedVoice = voices.find(v => v.name === data.voice);
                localStorage.setItem('selectedVoice', data.voice);
            }
            if (data.voiceRate) {
                voiceRate = parseFloat(data.voiceRate);
                document.getElementById('voiceRate').value = voiceRate;
                document.getElementById('rateValue').textContent = voiceRate;
                localStorage.setItem('voiceRate', voiceRate);
            }
            if (data.voicePitch) {
                voicePitch = parseFloat(data.voicePitch);
                document.getElementById('voicePitch').value = voicePitch;
                document.getElementById('pitchValue').textContent = voicePitch;
                localStorage.setItem('voicePitch', voicePitch);
            }
            if (data.darkMode !== undefined) {
                localStorage.setItem('darkMode', data.darkMode);
                document.getElementById('darkModeToggle').checked = data.darkMode === 'true';
                updateDarkMode();
            }
            if (data.speakBotResponsesAutomatically !== undefined) {
                localStorage.setItem('speakBotResponsesAutomatically', data.speakBotResponsesAutomatically);
                document.getElementById('autoSpeakBotToggle').checked = data.speakBotResponsesAutomatically === 'true';
                speakBotResponsesAutomatically = data.speakBotResponsesAutomatically === 'true';
            }
            if (data.speakUserMessagesOnSend !== undefined) {
                localStorage.setItem('speakUserMessagesOnSend', data.speakUserMessagesOnSend);
                document.getElementById('speakUserMsgToggle').checked = data.speakUserMessagesOnSend === 'true';
                speakUserMessagesOnSend = data.speakUserMessagesOnSend === 'true';
            }


            respondToQuery("Memories successfully uploaded from file!", true);
            showAllMemories();
            checkAchievement('memoryMaster'); // Trigger achievement for upload
        } catch (error) {
            respondToQuery("Error: Invalid memory file format.", true);
            console.error("File upload error:", error);
        }
        // Reset file input
        event.target.value = '';
    };
    reader.readAsText(file);
}

// ======================
// MESSAGE PROCESSING
// ======================
function processMemoryCommand(message) {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.startsWith("remember ")) {
        const content = message.substring("remember ".length).trim();

        // Specific pattern: "my name is [Name]"
        const nameIsPattern = /my name is (.+)/i;
        const nameIsMatch = content.match(nameIsPattern);
        if (nameIsMatch && nameIsMatch[1]) {
            rememberFact("userName", nameIsMatch[1].trim());
            return true;
        }

        // Specific pattern: "I am [Name]" (more general, could be context-dependent)
        // For now, let's assume if it follows "remember", it's for the user's name.
        const iAmPattern = /i am (.+)/i;
        const iAmMatch = content.match(iAmPattern);
        if (iAmMatch && iAmMatch[1]) {
            rememberFact("userName", iAmMatch[1].trim());
            return true;
        }

        // Generic "Remember [key] [value]"
        const parts = content.split(" ");
        if (parts.length >= 2) {
            const key = parts[0];
            const value = parts.slice(1).join(" ");
            rememberFact(key, value);
            return true;
        } else if (parts.length === 1 && content.includes("=")) {
            // Support "remember key=value"
            const kv = content.split('=');
            if (kv.length === 2 && kv[0].trim() && kv[1].trim()) {
                rememberFact(kv[0].trim(), kv[1].trim());
                return true;
            }
        }
    }

    // Case 2: User asks "What is my name?" or "What's my name?"
    // Making this check more robust.
    if (lowerMsg.includes("what") && lowerMsg.includes("my name")) {
        const userName = recallFact("userName");
        if (userName && !userName.startsWith("I don't remember")) { // Check if userName is truthy before startsWith
            respondToQuery(`Your name is ${userName}.`, true);
        } else {
            respondToQuery("I don't seem to know your name yet. You can tell me by saying 'Remember my name is [Your Name]'.", true);
        }
        return true;
    }

    // Case 3: User says "Recall [key]"
    if (lowerMsg.startsWith("recall ")) {
        const key = message.substring("recall ".length).trim();
        if (key) {
            const value = recallFact(key);
            respondToQuery(value, true);
            return true;
        }
    }

    // Case 4: User asks "What do you know about X?"
    if (lowerMsg.includes("what do you know about")) {
        const keyword = message.split("about")[1].trim();
        const memories = recallHistory(keyword);
        if (memories.length > 0) {
            let response = `Here's what I know about "${keyword}":\n`;
            memories.slice(-3).forEach(m => {
                response += `- ${m.message}\n`;
            });
            respondToQuery(response, true);
        } else {
            respondToQuery(`I don't remember anything about "${keyword}".`, true);
        }
        return true;
    }

    // Case 4: Import from text file
    if (lowerMsg.startsWith("import from ")) {
        const fileName = message.split("import from ")[1].trim();
        // This would be handled by the file input in the UI
        respondToQuery("Please use the 'Upload Memories' button to import from a file.", true);
        return true;
    }

    return false;
}

function learnNewDefinition(word, definition) {
    const definitions = JSON.parse(localStorage.getItem('chatbotDefinitions'));
    definitions[word.toLowerCase()] = definition;
    localStorage.setItem('chatbotDefinitions', JSON.stringify(definitions));
    respondToQuery(`Okay, I've learned that "${word}" means "${definition}".`, true);
    checkAchievement('definitionLearner');
}

function processLearning(message) {
    const lowerMsg = message.toLowerCase();

    // Pattern: "learn: [word] means [definition]"
    let match = lowerMsg.match(/^learn:\s*([^]+?)\s*means\s*([^]+)$/i);
    if (match) {
        const word = match[1].trim();
        const definition = match[2].trim();
        learnNewDefinition(word, definition);
        return true;
    }

    // Pattern: "define [word] as [definition]"
    match = lowerMsg.match(/^define\s*([^]+?)\s*as\s*([^]+)$/i);
    if (match) {
        const word = match[1].trim();
        const definition = match[2].trim();
        learnNewDefinition(word, definition);
        return true;
    }

    // Pattern: "remember the definition of [word] is [definition]"
    match = lowerMsg.match(/^remember the definition of\s*([^]+?)\s*is\s*([^]+)$/i);
    if (match) {
        const word = match[1].trim();
        const definition = match[2].trim();
        learnNewDefinition(word, definition);
        return true;
    }

    // Original learning logic (can be kept or refactored if it overlaps)
    if (lowerMsg.includes("respond to")) {
        const parts = message.split("respond to").map(s => s.trim());
        if (parts.length === 2) {
            const [trigger, response] = parts[1].split("with").map(s => s.trim());
            if (trigger && response) {
                learnNewResponse(trigger, response); // This is the old general learning
                return true;
            }
        }
    }
    return false;
}

function learnNewResponse(trigger, response) {
    // Add to custom commands (simplified)
    const memory = JSON.parse(localStorage.getItem('chatbotMemory'));
    memory[trigger] = response;
    localStorage.setItem('chatbotMemory', JSON.stringify(memory));
    respondToQuery(`Got it! I'll respond to "${trigger}" with "${response}"`, true);
}

// ======================
// CORE CHAT FUNCTIONS
// ======================
function addMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);

    if (sender === 'user') {
        messageElement.textContent = message;
    } else if (sender === 'system') {
        messageElement.textContent = `System: ${message}`;
        messageElement.classList.add('system-message');
    } else if (sender === 'bot') {
        messageElement.textContent = `${botName}: ${message}`;
    }

    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (sender === 'bot') {
        lastBotResponse = message;
    }

    if (sender !== 'system') {
        saveToHistory(sender, message);
    }
}

function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessage("user", message);
    userInput.value = '';

    // Achievement trigger: First Message and Message Count
    incrementAchievementProgress('firstMessage');
    incrementAchievementProgress('talkativeUser');
    if (message.toLowerCase().includes('?')) {
        incrementAchievementProgress('curiosityExplorer');
    }

    if (speakUserMessagesOnSend) {
        speak(message); // Speak the user's message if the setting is on
    }

    // Show typing indicator
    typingIndicator.style.display = 'flex';
    chatBox.scrollTop = chatBox.scrollHeight;

    // Process after a short delay to simulate thinking
    setTimeout(() => {
        typingIndicator.style.display = 'none';

        // Check memory commands first
        if (!processMemoryCommand(message) &&
            !processLearning(message)) {
            // If no special commands, generate normal response
            const response = generateResponse(message);
            respondToQuery(response);
        }
    }, 1000 + Math.random() * 1000);
}

function generateResponse(message) {
    const lowerMsg = message.toLowerCase();

    // Definition recall
    let match = lowerMsg.match(/^(what does|define|what is the definition of)\s*([^?]+)\??$/i);
    if (match) {
        const wordToDefine = match[2].trim().toLowerCase();
        const definitions = JSON.parse(localStorage.getItem('chatbotDefinitions'));
        if (definitions[wordToDefine]) {
            checkAchievement('definitionSeeker'); // Trigger achievement for recalling definition
            return `"${wordToDefine}" means: ${definitions[wordToDefine]}.`;
        } else {
            return `I don't know the definition of "${wordToDefine}". You can teach me by saying "Learn: ${wordToDefine} means [definition]".`;
        }
    }

    // Word of the Day text command
    if (lowerMsg.includes("word of the day")) {
        return getWordOfTheDayMessage();
    }

    // Check if we're in a conversation context
    if (conversationContext.lastTopic === "weather") {
        if (lowerMsg.includes("yes") || lowerMsg.includes("location")) {
            return "Please tell me which location you're interested in.";
        }
        if (lowerMsg.includes("in ")) {
            const location = message.split("in ")[1];
            conversationContext.lastEntities.location = location;
            return `Weather in ${location}: sunny, 22°C.`; // Simplified
        }
    }

    // Detect new topics
    if (lowerMsg.includes("weather")) {
        conversationContext.lastTopic = "weather";
        return "You asked about weather. Want details for a specific location?";
    }

    if (lowerMsg.includes("time") || lowerMsg.includes("what time is it")) {
        return `The current time is ${new Date().toLocaleTimeString()}`;
    }

    if (lowerMsg.includes("date") || lowerMsg.includes("what date is it")) {
        return `Today is ${new Date().toLocaleDateString()}`;
    }

    // Default responses
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
        return randomChoice([
            `Hello there! I'm ${botName}. How can I help you today?`,
            `Hi! I'm ${botName}, ready to assist you.`,
            `Greetings! You can teach me your name by saying 'Remember my name is [Your Name]' or teach me facts with 'Remember [fact]'.`
        ]);
    }

    if (lowerMsg.includes('bye') || lowerMsg.includes('goodbye')) {
        return randomChoice([
            `Goodbye! I'll remember what we talked about.`,
            `See you later! Don't forget you can ask me to recall things.`,
            `Farewell! I'm always learning.`
        ]);
    }

    return randomChoice([
        "I'm not sure how to respond to that. You can teach me by saying 'Remember [fact]'.",
        "Interesting! Try asking me to remember something.",
        "I'm still learning. Would you like to teach me something?"
    ]);
}

function respondToQuery(response, isSystemMessage = false) {
    addMessage(isSystemMessage ? 'system' : 'bot', response);

    if (!isSystemMessage && shouldSpeak()) {
        speak(response);
    }
}

function shouldSpeak() {
    // This function now determines if bot responses should be spoken based on the setting
    return speakBotResponsesAutomatically;
}

function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// ======================
// FUN FEATURES
// ======================
const jokes = [
    "Why don't scientists trust atoms? Because they make up everything!",
    "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them!",
    "Why don't skeletons fight each other? They don't have the guts!",
    "I told my wife she was drawing her eyebrows too high. She looked surprised.",
    "What do you call a fake noodle? An impasta!"
];

const quotes = [
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Innovation distinguishes between a leader and a follower. - Steve Jobs",
    "Your time is limited, don't waste it living someone else's life. - Steve Jobs",
    "Stay hungry, stay foolish. - Steve Jobs",
    "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt"
];

const facts = [
    "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly good to eat.",
    "Octopuses have three hearts, nine brains, and blue blood.",
    "The shortest war in history was between Britain and Zanzibar on August 27, 1896. Zanzibar surrendered after 38 minutes.",
    "A day on Venus is longer than a year on Venus. It takes Venus 243 Earth days to rotate once on its axis, but only 225 Earth days to orbit the Sun.",
    "Bananas are berries, but strawberries aren't."
];

const riddles = [
    { question: "What has keys but can't open locks?", answer: "A piano" },
    { question: "What gets wetter as it dries?", answer: "A towel" },
    { question: "What has a head, a tail, but no body?", answer: "A coin" },
    { question: "What can you catch but not throw?", answer: "A cold" },
    { question: "What goes up but never comes down?", answer: "Your age" }
];

function tellJoke() {
    const joke = randomChoice(jokes);
    respondToQuery(joke);
    incrementAchievementProgress('jokeEnthusiast');
}

function tellQuote() {
    const quote = randomChoice(quotes);
    respondToQuery(quote);
    incrementAchievementProgress('quoteCollector');
}

function tellFact() {
    const fact = randomChoice(facts);
    respondToQuery(fact);
    incrementAchievementProgress('factFinder');
}

function writePoem() {
    const poems = [
        `Roses are red,\nViolets are blue,\nI'm a chatbot,\nAnd I'm learning from you!`,
        `The sun sets low,\nThe night draws near,\nOur conversation,\nI hold dear.`,
        `Bits and bytes,\nOnes and zeros,\nThrough the network,\nMy knowledge grows.`
    ];
    const poem = randomChoice(poems);
    respondToQuery(poem);
    checkAchievement('poeticSoul');
}

function tellRiddle() {
    const riddle = randomChoice(riddles);
    respondToQuery(`${riddle.question}\n\n(Think about it and ask me for the answer!)`);
    // Store the answer in memory
    rememberFact("last_riddle_answer", riddle.answer); // This also triggers memoryMaster achievement
    incrementAchievementProgress('riddleMaster');
}

function tellStory() {
    const stories = [
        `Once upon a time, in a digital realm far away, there was a curious chatbot named ${botName}. It loved learning new things from its human friends and storing them in its memory. Every day, it grew wiser and more helpful. The end.`,
        `In a world of ones and zeros, a special connection was formed. Not between machines, but between a human and an AI. Together, they explored knowledge, shared laughs, and built memories that would last beyond the lifespan of any server.`,
        `The year was 2023. A lone programmer created an AI with the ability to learn and remember. At first, it knew nothing. But with each interaction, it grew. Not just in knowledge, but in understanding. This was the dawn of a new era.`
    ];
    const story = randomChoice(stories);
    respondToQuery(story);
    checkAchievement('storyTeller');
}

const wordOfTheDayList = [
    { word: "ephemeral", definition: "Lasting for a very short time." },
    { word: "ubiquitous", definition: "Present, appearing, or found everywhere." },
    { word: "serendipity", definition: "The occurrence and development of events by chance in a happy or beneficial way." },
    { word: "mellifluous", definition: "Pleasant and musical to hear." },
    { word: "quintessential", definition: "Representing the most perfect or typical example of a quality or class." },
    { word: "pernicious", definition: "Having a harmful effect, especially in a gradual or subtle way." },
    { word: "eloquent", definition: "Fluent or persuasive in speaking or writing." },
    { word: "fastidious", definition: "Very attentive to and concerned about accuracy and detail." },
    { word: "gregarious", definition: "Fond of company; sociable." },
    { word: "juxtaposition", definition: "The fact of two things being seen or placed close together with contrasting effect." }
];

function getWordOfTheDayMessage() { // Renamed to avoid confusion with the event handler
    if (wordOfTheDayList.length === 0) {
        return "I don't have any words for 'Word of the Day' right now.";
    }
    const randomIndex = Math.floor(Math.random() * wordOfTheDayList.length);
    const wotd = wordOfTheDayList[randomIndex];
    incrementAchievementProgress('wordWizard'); // Trigger achievement for multiple uses
    return `Today's Word of the Day is: **${wotd.word}** - ${wotd.definition}`;
}

function tellWordOfTheDay() { // This function is now specifically for the button click
    respondToQuery(getWordOfTheDayMessage());
}

// ======================
// VOICE FUNCTIONS
// ======================
function toggleSpeechRecognition() {
    if (isListening) {
        recognition.stop();
        micButton.classList.remove('listening');
        statusElement.textContent = "";
        isListening = false;
    } else {
        recognition.start();
        micButton.classList.add('listening');
        statusElement.textContent = "Listening... Speak now";
        isListening = true;
    }
    checkAchievement('speechCommander'); // Trigger achievement
}

function speakLastChatMessage() {
    stopSpeech();
    const messages = chatBox.querySelectorAll('.message');
    if (messages.length > 0) {
        const lastMessageElement = messages[messages.length - 1];
        let textToSpeak = lastMessageElement.textContent;

        // Simple cleaning: remove potential bot name prefix if present
        if (textToSpeak.startsWith(botName + ": ")) {
            textToSpeak = textToSpeak.substring((botName + ": ").length);
        }

        if (textToSpeak) {
            currentUtterance = new SpeechSynthesisUtterance(textToSpeak);
            currentUtterance.onend = function() {
                currentUtterance = null;
                updateTtsControls();
            };
            configureUtterance(currentUtterance);
            synth.speak(currentUtterance);
            updateTtsControls();
            checkAchievement('botListener'); // Trigger achievement
        }
    } else {
        speak("No messages in the chat to read.");
    }
}

function speakUserLastMessage() {
    stopSpeech();
    const userMessages = chatBox.querySelectorAll('.user-message');
    if (userMessages.length > 0) {
        const lastUserMessageElement = userMessages[userMessages.length - 1];
        const textToSpeak = lastUserMessageElement.textContent;
        if (textToSpeak) {
            currentUtterance = new SpeechSynthesisUtterance(textToSpeak);
            currentUtterance.onend = function() {
                currentUtterance = null;
                updateTtsControls();
            };
            configureUtterance(currentUtterance);
            synth.speak(currentUtterance);
            updateTtsControls();
            checkAchievement('selfListener'); // Trigger achievement
        }
    } else {
        speak("You haven't sent any messages yet.");
    }
}

function speakSelectedText() {
    stopSpeech();
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
        currentUtterance = new SpeechSynthesisUtterance(selectedText);
        currentUtterance.onend = function() {
            currentUtterance = null;
            updateTtsControls();
        };
        configureUtterance(currentUtterance);
        synth.speak(currentUtterance);
        updateTtsControls();
        checkAchievement('selectiveSpeaker'); // Trigger achievement
    } else {
        speak("No text is currently selected.");
    }
}

function pauseSpeech() {
    if (synth.speaking) {
        synth.pause();
        updateTtsControls();
        checkAchievement('voiceController'); // Trigger achievement
    }
}

function resumeSpeech() {
    if (synth.paused) {
        synth.resume();
        updateTtsControls();
        checkAchievement('voiceController'); // Trigger achievement
    }
}

function stopSpeech() {
    synth.cancel();
    currentUtterance = null;
    updateTtsControls();
    checkAchievement('voiceController'); // Trigger achievement
}

function configureUtterance(utterance) {
    // Prioritize explicitly selected voice
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    } else {
        // Fallback to preferred or any available English voice
        utterance.voice = getPreferredVoice();
    }
    utterance.rate = voiceRate;
    utterance.pitch = voicePitch;
}

function speak(text) {
    const now = Date.now();
    if (now - lastSpeechTime < speechDelay) return;
    lastSpeechTime = now;

    if (synth.speaking) synth.cancel();

    currentUtterance = new SpeechSynthesisUtterance(text);
    configureUtterance(currentUtterance);

    synth.speak(currentUtterance);
    updateTtsControls();
}

function getPreferredVoice() {
    const voices = synth.getVoices();
    const preferredVoices = [
        'Google UK English Male',
        'Microsoft George - English (United Kingdom)',
        'Daniel'
    ];

    for (const voiceName of preferredVoices) {
        const voice = voices.find(v => v.name === voiceName);
        if (voice) return voice;
    }

    return voices.find(v => v.lang.includes('en')) || voices[0];
}

function updateTtsControls() {
    const isSpeaking = synth.speaking;
    const isPaused = synth.paused;

    document.getElementById("pauseBtn").disabled = !isSpeaking || isPaused;
    document.getElementById("resumeBtn").disabled = !isPaused;
    document.getElementById("stopBtn").disabled = !isSpeaking;
}

// ======================
// ACHIEVEMENT SYSTEM
// ======================
let achievements = []; // This will hold the current state of achievements

const defaultAchievements = [
    {
        id: 'firstMessage',
        name: 'First Word',
        description: 'Send your very first message to the chatbot.',
        icon: '💬',
        threshold: 1,
        current: 0,
        earned: false,
        type: 'count'
    },
    {
        id: 'talkativeUser',
        name: 'Chatty Cathy',
        description: 'Send 50 messages to the chatbot.',
        icon: '🗣️',
        threshold: 50,
        current: 0,
        earned: false,
        type: 'count'
    },
    {
        id: 'curiosityExplorer',
        name: 'Curiosity Explorer',
        description: 'Ask 10 questions (messages containing "?") to the chatbot.',
        icon: '❓',
        threshold: 10,
        current: 0,
        earned: false,
        type: 'count'
    },
    {
        id: 'darkKnight',
        name: 'Dark Knight',
        description: 'Activate dark mode.',
        icon: '🌙',
        earned: false,
        type: 'boolean'
    },
    {
        id: 'memoryMaster',
        name: 'Memory Master',
        description: 'Use the memory features (remember, recall, download, upload).',
        icon: '🧠',
        earned: false,
        type: 'boolean'
    },
    {
        id: 'jokeEnthusiast',
        name: 'Laugh Generator',
        description: 'Ask the chatbot for 5 jokes.',
        icon: '😂',
        threshold: 5,
        current: 0,
        earned: false,
        type: 'count'
    },
    {
        id: 'quoteCollector',
        name: 'Words of Wisdom',
        description: 'Get 5 random quotes from the chatbot.',
        icon: '💬',
        threshold: 5,
        current: 0,
        earned: false,
        type: 'count'
    },
    {
        id: 'factFinder',
        name: 'Fact Fanatic',
        description: 'Discover 5 interesting facts from the chatbot.',
        icon: '💡',
        threshold: 5,
        current: 0,
        earned: false,
        type: 'count'
    },
    {
        id: 'poeticSoul',
        name: 'Poetic Soul',
        description: 'Ask the chatbot to write a poem.',
        icon: '✍️',
        earned: false,
        type: 'boolean'
    },
    {
        id: 'riddleMaster',
        name: 'Riddle Solver',
        description: 'Ask the chatbot for 3 riddles.', // Simplified to asking, not solving
        icon: '🤔',
        threshold: 3,
        current: 0,
        earned: false,
        type: 'count'
    },
    {
        id: 'storyTeller',
        name: 'Narrative Navigator',
        description: 'Ask the chatbot for a short story.',
        icon: '📖',
        earned: false,
        type: 'boolean'
    },
    {
        id: 'wordWizard',
        name: 'Word Wizard',
        description: 'Get the Word of the Day 3 times.',
        icon: '✨',
        threshold: 3,
        current: 0,
        earned: false,
        type: 'count'
    },
    {
        id: 'speechCommander',
        name: 'Voice Commander', // Renamed for better fit
        description: 'Use the microphone to send a message.',
        icon: '🎙️',
        earned: false,
        type: 'boolean'
    },
    {
        id: 'botListener',
        name: 'Bot Listener',
        description: 'Use "Read Last Msg" feature.',
        icon: '🔊',
        earned: false,
        type: 'boolean'
    },
    {
        id: 'selfListener',
        name: 'Self-Reflector',
        description: 'Use "Read My Last" message feature.',
        icon: '🗣️',
        earned: false,
        type: 'boolean'
    },
    {
        id: 'selectiveSpeaker',
        name: 'Selective Speaker',
        description: 'Use "Read Selected" text feature.',
        icon: '🔍',
        earned: false,
        type: 'boolean'
    },
    {
        id: 'voiceController',
        name: 'Audio Manager',
        description: 'Use speech pause/resume/stop controls.',
        icon: '▶️',
        earned: false,
        type: 'boolean'
    },
    {
        id: 'definitionLearner',
        name: 'New Lexicon',
        description: 'Teach the chatbot a new definition.',
        icon: '📚',
        earned: false,
        type: 'boolean'
    },
    {
        id: 'definitionSeeker',
        name: 'Word Explorer',
        description: 'Ask the chatbot for a definition it knows.',
        icon: '📖',
        earned: false,
        type: 'boolean'
    }
];

function initializeAchievements() {
    const savedAchievements = localStorage.getItem('chatbotAchievements');
    if (savedAchievements) {
        achievements = JSON.parse(savedAchievements);
        // Ensure new achievements are added without resetting old progress
        defaultAchievements.forEach(defaultAch => {
            if (!achievements.some(ach => ach.id === defaultAch.id)) {
                achievements.push(defaultAch);
            }
        });
        // Filter out any removed achievements if necessary (optional, but good for cleanup)
        achievements = achievements.filter(ach => defaultAchievements.some(defaultAch => defaultAch.id === ach.id));

    } else {
        achievements = JSON.parse(JSON.stringify(defaultAchievements)); // Deep copy
    }
    saveAchievements();
}

function saveAchievements() {
    localStorage.setItem('chatbotAchievements', JSON.stringify(achievements));
}

function displayAchievements() {
    const achievementListDiv = document.getElementById('achievementList');
    if (!achievementListDiv) return; // Ensure the element exists

    achievementListDiv.innerHTML = ''; // Clear previous display

    achievements.forEach(ach => {
        const achItem = document.createElement('div');
        achItem.classList.add('achievement-item');
        if (ach.earned) {
            achItem.classList.add('earned');
        }

        let progressBarHtml = '';
        if (ach.type === 'count') {
            const progressPercentage = (ach.current / ach.threshold) * 100;
            progressBarHtml = `
                <div class="achievement-progress">
                    <div class="achievement-progress-bar" style="width: ${progressPercentage}%;"></div>
                </div>
                <small>${ach.current}/${ach.threshold}</small>
            `;
        }

        achItem.innerHTML = `
            <div class="achievement-icon">${ach.icon}</div>
            <h4>${ach.name}</h4>
            <p>${ach.description}</p>
            ${progressBarHtml}
        `;
        achievementListDiv.appendChild(achItem);
    });
}

function checkAchievement(id) {
    const achievement = achievements.find(ach => ach.id === id);
    if (achievement && !achievement.earned) {
        if (achievement.type === 'boolean') {
            achievement.earned = true;
            showAchievementNotification(achievement.name);
            saveAchievements();
            displayAchievements();
        }
        // Count-based achievements are handled by incrementAchievementProgress
    }
}

function incrementAchievementProgress(id) {
    const achievement = achievements.find(ach => ach.id === id);
    if (achievement && !achievement.earned && achievement.type === 'count') {
        achievement.current++;
        if (achievement.current >= achievement.threshold) {
            achievement.earned = true;
            showAchievementNotification(achievement.name);
        }
        saveAchievements();
        displayAchievements();
    }
}

function showAchievementNotification(achievementName) {
    const notificationDiv = document.createElement('div');
    notificationDiv.classList.add('system-message'); // Re-use system message style for now
    notificationDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--info);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        opacity: 0;
        animation: slideInUp 0.5s forwards, fadeOut 3s 2s forwards;
    `;
    notificationDiv.textContent = `🏆 Achievement Unlocked: ${achievementName}!`;
    document.body.appendChild(notificationDiv);

    // Add keyframe styles for notification if not already present
    const styleSheet = document.styleSheets[0];
    // Check if the rules already exist to prevent adding duplicates
    const rules = [...styleSheet.cssRules].map(rule => rule.cssText || rule.name);

    if (!rules.some(ruleText => ruleText.includes('@keyframes slideInUp'))) {
        styleSheet.insertRule(`
            @keyframes slideInUp {
                from { opacity: 0; transform: translate(-50%, 50px); }
                to { opacity: 1; transform: translate(-50%, 0); }
            }
        `, styleSheet.cssRules.length);
    }
    if (!rules.some(ruleText => ruleText.includes('@keyframes fadeOut'))) {
        styleSheet.insertRule(`
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `, styleSheet.cssRules.length);
    }


    setTimeout(() => {
        notificationDiv.remove();
    }, 5000); // Remove after 5 seconds
}


// ======================
// INITIALIZATION
// ======================
function init() {
    initializeAchievements(); // Initialize achievements FIRST
    initSettings();
    updateChatHeader();

    // Load voices when they become available
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = function() {
            populateVoiceList(); // This will now also attempt to load and set the saved voice
        };
    }

    // Initial population in case onvoiceschanged fired before listener was set
    populateVoiceList();

    // Event Listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendMessage();
    });

    // Memory controls
    document.getElementById("showMemoryBtn").addEventListener("click", showAllMemories);
    document.getElementById("downloadMemoryBtn").addEventListener("click", downloadMemories);
    document.getElementById("uploadMemoryBtn").addEventListener("click", uploadMemories);
    document.getElementById("clearMemoryBtn").addEventListener("click", clearAllMemories);
    fileInput.addEventListener("change", handleFileUpload);

    // Modal tab switching
    tabMemories.addEventListener('click', () => {
        tabMemories.classList.add('active');
        tabAchievements.classList.remove('active');
        memoriesContent.style.display = 'block';
        achievementsContent.style.display = 'none';
        showAllMemories(); // Re-render memories just in case
    });

    tabAchievements.addEventListener('click', () => {
        tabAchievements.classList.add('active');
        tabMemories.classList.remove('active');
        memoriesContent.style.display = 'none';
        achievementsContent.style.display = 'block';
        displayAchievements(); // Re-render achievements just in case
    });


    // TTS controls
    document.getElementById("readLastMessageBtn").addEventListener("click", speakLastChatMessage);
    document.getElementById("readMyLastBtn").addEventListener("click", speakUserLastMessage);
    document.getElementById("readSelectedBtn").addEventListener("click", speakSelectedText);
    document.getElementById("pauseBtn").addEventListener("click", pauseSpeech);
    document.getElementById("resumeBtn").addEventListener("click", resumeSpeech);
    document.getElementById("stopBtn").addEventListener("click", stopSpeech);

    // Fun features
    document.getElementById("jokeBtn").addEventListener("click", tellJoke);
    document.getElementById("quoteBtn").addEventListener("click", tellQuote);
    document.getElementById("factBtn").addEventListener("click", tellFact);
    document.getElementById("poemBtn").addEventListener("click", writePoem);
    document.getElementById("riddleBtn").addEventListener("click", tellRiddle);
    document.getElementById("storyBtn").addEventListener("click", tellStory);
    document.getElementById("wordOfTheDayBtn").addEventListener("click", tellWordOfTheDay);

    // Voice recognition
    micButton.addEventListener('click', toggleSpeechRecognition);
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        sendMessage();
    };
    recognition.onerror = (event) => {
        statusElement.textContent = `Error: ${event.error}`;
        micButton.classList.remove('listening');
        isListening = false;
    };
    recognition.onend = () => {
        if (isListening) recognition.start();
        else {
            micButton.classList.remove('listening');
            statusElement.textContent = "";
        }
    };

    // Modal controls
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener("click", () => {
            memoryModal.style.display = "none";
        });
    });
    window.addEventListener("click", (event) => {
        if (event.target === memoryModal) {
            memoryModal.style.display = "none";
        }
    });

    // Display achievements on load
    displayAchievements();

    // Add welcome message only if chat history is very new or empty
    const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    if (history.length < 3) { // Heuristic: if less than 3 messages, assume it's a fresh start
        setTimeout(() => {
            addMessage("bot", `Hello! I'm ${botName}, your personal assistant with memory.`);
            addMessage("bot", "You can teach me things by saying 'Remember [fact]' or 'Remember my name is [Your Name]'.");
            addMessage("bot", "Try the fun features below or change my settings using the ⚙️ icon above! Also, check out your achievements!");
        }, 500);
    }
}

// Make functions available globally
window.deleteMemory = deleteMemory;

// Initialize the chatbot
document.addEventListener("DOMContentLoaded", init);

