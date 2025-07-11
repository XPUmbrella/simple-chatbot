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
// LLM INTEGRATION CONFIGURATION
// ======================
// IMPORTANT: Replace these placeholders with your actual LLM API endpoint and key.
// Using LLM APIs may incur costs depending on the provider and usage.
const LLM_API_ENDPOINT = 'YOUR_LLM_API_ENDPOINT_HERE'; // e.g., 'https://api.example.com/v1/chat/completions'
const LLM_API_KEY = 'YOUR_LLM_API_KEY_HERE';
const USE_SIMULATED_LLM = true; // Set to false to use the actual API, true to use simulated responses for testing.

// ======================
// SETTINGS SYSTEM
// ======================
let botName = localStorage.getItem('botName') || "Assistant";
let selectedVoice = null; // This will store the SpeechSynthesisVoice OBJECT

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
    populateVoiceList(); // Call this to initially populate and set voice
    document.getElementById('voiceSelect').addEventListener('change', function() {
        const voiceName = this.value;
        if (voiceName) {
            const voices = synth.getVoices();
            selectedVoice = voices.find(v => v.name === voiceName); // Set global selectedVoice object
            localStorage.setItem('selectedVoice', voiceName); // Store the name
        } else {
            selectedVoice = null; // "Select a voice" chosen
            localStorage.removeItem('selectedVoice');
        }
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
    document.querySelector('.chat-header #chatBotName').textContent = `${botName}`;
}

function populateVoiceList() {
    const voiceSelect = document.getElementById('voiceSelect');
    const currentVoices = synth.getVoices(); 

    if (currentVoices.length === 0) {
        // console.log("No voices loaded yet, will retry on voiceschanged or timeout.");
        // If onvoiceschanged is not reliable, a timeout retry might be needed here for some browsers.
        return; 
    }
    
    const previouslySelectedNameInDropdown = voiceSelect.value; 
    voiceSelect.innerHTML = ''; 

    const defaultOption = document.createElement('option');
    defaultOption.textContent = 'Select a voice';
    defaultOption.value = '';
    voiceSelect.appendChild(defaultOption);

    const britishVoices = currentVoices.filter(v => v.lang.includes('en-GB'));
    const otherEnglishVoices = currentVoices.filter(v => v.lang.includes('en-') && !v.lang.includes('en-GB'));
    const nonEnglishVoices = currentVoices.filter(v => !v.lang.startsWith('en-'));

    let preferredDefaultVoiceName = null; // Store the name of the preferred default

    if (britishVoices.length > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = 'British Voices';
        britishVoices.forEach(voice => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.value = voice.name;
            optgroup.appendChild(option);
            if (!preferredDefaultVoiceName && (voice.name.includes('Male') || voice.name.includes('George'))) {
                preferredDefaultVoiceName = voice.name; // Mark as potential default
            }
        });
        voiceSelect.appendChild(optgroup);
    }

    if (otherEnglishVoices.length > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = 'Other English Voices';
        otherEnglishVoices.forEach(voice => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.value = voice.name;
            optgroup.appendChild(option);
            if (!preferredDefaultVoiceName) { // Fallback if no British preferred
                 preferredDefaultVoiceName = voice.name;
            }
        });
        voiceSelect.appendChild(optgroup);
    }
    
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

    // Attempt to apply a previously selected valid voice from localStorage
    const savedVoiceName = localStorage.getItem('selectedVoice');
    let appliedSavedVoice = false;
    if (savedVoiceName) {
        const foundVoiceObject = currentVoices.find(v => v.name === savedVoiceName);
        if (foundVoiceObject) {
            voiceSelect.value = savedVoiceName; // Set dropdown to the valid saved voice
            appliedSavedVoice = true;
        } else {
            localStorage.removeItem('selectedVoice'); // Remove invalid/outdated stored name
        }
    }

    // If no valid saved voice was applied, apply the preferred default (if any)
    if (!appliedSavedVoice && preferredDefaultVoiceName) {
        const hasPreferredDefaultInList = Array.from(voiceSelect.options).some(opt => opt.value === preferredDefaultVoiceName);
        if (hasPreferredDefaultInList) {
            voiceSelect.value = preferredDefaultVoiceName;
        }
    }
    
    // If after all that, the dropdown is still on "Select a voice" (value=""),
    // but there was a previously selected value in the dropdown (e.g. browser default), try to restore it.
    // This handles cases where localStorage was cleared or had an invalid voice.
    if (!voiceSelect.value && previouslySelectedNameInDropdown) {
         const voiceExists = currentVoices.some(v => v.name === previouslySelectedNameInDropdown);
         if(voiceExists) {
            voiceSelect.value = previouslySelectedNameInDropdown;
         }
    }
    
    // Final Synchronization: Set the global selectedVoice object based on the dropdown's final state.
    const finalSelectedNameInDropdown = voiceSelect.value;
    if (finalSelectedNameInDropdown) {
        selectedVoice = currentVoices.find(v => v.name === finalSelectedNameInDropdown);
        // If the current dropdown value led to a valid voice object,
        // ensure it's what's in localStorage (especially if it came from a default).
        if (selectedVoice && localStorage.getItem('selectedVoice') !== finalSelectedNameInDropdown) {
            localStorage.setItem('selectedVoice', finalSelectedNameInDropdown);
        }
    } else {
        // No valid voice is selected (e.g., "Select a voice" is the actual selection)
        selectedVoice = null;
        localStorage.removeItem('selectedVoice'); // Ensure nothing is stored if "Select a voice"
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
            if (data.voice) { // This is a voice NAME (string)
                localStorage.setItem('selectedVoice', data.voice); // Save the name
                populateVoiceList(); // Repopulate and re-evaluate selection based on new saved name
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
    // Applying generalized regex and ensuring speech for the name.
    if (/(what|who|say|tell me).*my name/i.test(lowerMsg)) {
        const userName = recallFact("userName");
        if (userName && !userName.startsWith("I don't remember")) { // Check if userName is truthy before startsWith
            respondToQuery(`Your name is ${userName}.`, false); // Set to false to enable speech
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
// LLM API CALL FUNCTION
// ======================
async function callLlmApi(message) {
    if (USE_SIMULATED_LLM || LLM_API_ENDPOINT === 'YOUR_LLM_API_ENDPOINT_HERE' || LLM_API_KEY === 'YOUR_LLM_API_KEY_HERE') {
        // Simulate API call for testing if actual endpoint/key are not set or if simulation is forced
        return new Promise(resolve => {
            setTimeout(() => {
                if (message.toLowerCase().includes("error test")) {
                    resolve({ error: "Simulated LLM API error." });
                } else if (message.toLowerCase().includes("empty test")) {
                    resolve({ response: "" });
                }
                else {
                    resolve({ response: `Simulated LLM response to: "${message}"` });
                }
            }, 1500);
        });
    }

    // Actual API call (requires LLM_API_ENDPOINT and LLM_API_KEY to be set)
    try {
        const response = await fetch(LLM_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LLM_API_KEY}` // Adjust authorization as per your LLM API's requirements
            },
            body: JSON.stringify({
                prompt: message, // This is a simplified payload; adjust to your LLM API's specific schema
                max_tokens: 150 // Example parameter
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Unknown API error" }));
            console.error('LLM API Error:', response.status, errorData);
            return { error: `LLM API request failed with status ${response.status}. ${errorData.message || ''}` };
        }

        const data = await response.json();
        // Extract the response text according to your LLM API's response structure
        // This is a common structure, but might need adjustment:
        const llmResponseText = data.choices && data.choices[0] && data.choices[0].text ? data.choices[0].text.trim() : null;

        if (llmResponseText) {
            return { response: llmResponseText };
        } else {
            console.error('LLM API Error: No response text found in API output.', data);
            return { error: "LLM API returned an empty or malformed response." };
        }

    } catch (error) {
        console.error('Error calling LLM API:', error);
        return { error: `Failed to connect to LLM API. ${error.message}` };
    }
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

async function sendMessage() {
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
    setTimeout(async () => {
        typingIndicator.style.display = 'none';

        // Check memory and learning commands first
        if (processMemoryCommand(message) || processLearning(message)) {
            // Command processed, no further action needed here as those functions call respondToQuery
            return;
        }

        // Try to generate a rule-based response
        const ruleBasedResponse = generateResponse(message);

        if (ruleBasedResponse !== null) { // Check if generateResponse provided a direct answer
            respondToQuery(ruleBasedResponse);
        } else {
            // No rule-based response, try LLM
            const llmResult = await callLlmApi(message);
            if (llmResult.error) {
                respondToQuery(`Error interacting with LLM: ${llmResult.error}`, true); // System message for LLM errors
            } else if (llmResult.response && llmResult.response.trim() !== "") {
                respondToQuery(llmResult.response);
                 // Achievement: First time LLM is successfully used
                checkAchievement('llmFirstResponse');
            } else {
                // LLM gave no response or an empty one, fallback
                const fallbackResponse = randomChoice([
                    "I'm not quite sure how to respond to that right now.",
                    "That's an interesting point, but I don't have a specific comment.",
                    "I'm still learning and couldn't process that fully. Try rephrasing?"
                ]);
                respondToQuery(fallbackResponse);
            }
        }
    }, 1000 + Math.random() * 500); // Reduced max random delay
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
            // Don't return a direct response here, let it fall through to LLM or fallback
            // return `I don't know the definition of "${wordToDefine}". You can teach me by saying "Learn: ${wordToDefine} means [definition]".`;
        }
    }

    // Word of the Day text command
    if (/word of the day/i.test(lowerMsg)) {
        return getWordOfTheDayMessage();
    }

    // Check if we're in a conversation context
    if (conversationContext.lastTopic === "weather") {
        if (lastBotResponse === "Please tell me which location you're interested in." || lastBotResponse === "You asked about weather. Want details for a specific location?") {
            const location = message.trim();
            conversationContext.lastEntities.location = location;
            conversationContext.lastTopic = null; 
            return `Weather in ${location}: sunny, 22°C. (Simulated)`;
        }
        if (lowerMsg.includes("yes") || lowerMsg.includes("location") || lowerMsg.includes("please")) {
            return "Please tell me which location you're interested in.";
        }
        if (lowerMsg.includes("in ")) {
            const location = message.split("in ")[1].trim();
            conversationContext.lastEntities.location = location;
            conversationContext.lastTopic = null; 
            return `Weather in ${location}: sunny, 22°C. (Simulated)`;
        }
    }

    // Detect new topics
    if (lowerMsg.includes("weather") && conversationContext.lastTopic !== "weather") {
        conversationContext.lastTopic = "weather";
        return "You asked about weather. Want details for a specific location?";
    }

    if (lowerMsg.includes("time") || lowerMsg.includes("what time is it")) {
        return `The current time is ${new Date().toLocaleTimeString()}`;
    }

    if (lowerMsg.includes("date") || lowerMsg.includes("what date is it")) {
        return `Today is ${new Date().toLocaleDateString()}`;
    }

    // Default responses for greetings - these can be primary
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

    // If no specific rule-based response is found, return null to indicate LLM should be tried.
    return null;
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
        // UI updates will be handled by recognition.onend or recognition.onerror
    } else {
        try {
            recognition.start();
            micButton.classList.add('listening');
            statusElement.textContent = "Listening... Speak now";
            isListening = true;
            checkAchievement('speechCommander'); 
        } catch (e) {
            console.error("Error starting speech recognition:", e);
            statusElement.textContent = "Mic error. Try again.";
            isListening = false;
            micButton.classList.remove('listening');
        }
    }
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
    if (selectedVoice && selectedVoice instanceof SpeechSynthesisVoice) { // Check if it's a valid voice object
        utterance.voice = selectedVoice;
    } else {
        // Fallback to preferred or any available English voice
        utterance.voice = getPreferredVoice();
    }
    utterance.rate = voiceRate;
    utterance.pitch = voicePitch;
    // utterance.volume = voiceVolume; // Add this if/when volume control is re-integrated
}

function speak(text) {
    const now = Date.now();
    if (now - lastSpeechTime < speechDelay && currentUtterance) return; // Allow override if no current utterance
    lastSpeechTime = now;

    if (synth.speaking) synth.cancel(); // Cancel current before speaking new

    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.onend = () => { // Ensure currentUtterance is nulled on end
        currentUtterance = null;
        updateTtsControls();
    };
    currentUtterance.onerror = (event) => { // Handle speech errors
        console.error("Speech synthesis error:", event.error);
        currentUtterance = null;
        updateTtsControls();
    };
    configureUtterance(currentUtterance);

    synth.speak(currentUtterance);
    updateTtsControls();
}

function getPreferredVoice() {
    const voices = synth.getVoices();
    if (voices.length === 0) return null; // No voices available

    const preferredVoices = [
        'Google UK English Male',
        'Microsoft George - English (United Kingdom)',
        'Daniel' // Common macOS UK English voice
    ];

    for (const voiceName of preferredVoices) {
        const voice = voices.find(v => v.name === voiceName);
        if (voice) return voice;
    }
    
    // Fallback to any UK English voice
    const ukVoice = voices.find(v => v.lang === 'en-GB');
    if (ukVoice) return ukVoice;

    // Fallback to any English voice
    const enVoice = voices.find(v => v.lang.startsWith('en-'));
    if (enVoice) return enVoice;
    
    return voices[0]; // Absolute fallback to the first available voice
}

function updateTtsControls() {
    const isSpeaking = synth.speaking;
    const isPaused = synth.paused;

    document.getElementById("pauseBtn").disabled = !isSpeaking || isPaused;
    document.getElementById("resumeBtn").disabled = !isPaused;
    document.getElementById("stopBtn").disabled = !isSpeaking && !isPaused; // Enable stop if not speaking but was paused
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
    },
    {
        id: 'llmFirstResponse',
        name: 'AI Powered',
        description: 'Get your first response generated by the LLM.',
        icon: '🚀',
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
                achievements.push(JSON.parse(JSON.stringify(defaultAch))); // Add a deep copy of new defaults
            } else { // If achievement exists, ensure its properties are up-to-date with default (except current/earned)
                const existingAch = achievements.find(ach => ach.id === defaultAch.id);
                existingAch.name = defaultAch.name;
                existingAch.description = defaultAch.description;
                existingAch.icon = defaultAch.icon;
                existingAch.threshold = defaultAch.threshold;
                existingAch.type = defaultAch.type;
            }
        });
        // Filter out any achievements that are no longer in defaultAchievements (optional, but good for cleanup)
        achievements = achievements.filter(ach => defaultAchievements.some(defaultAch => defaultAch.id === ach.id));

    } else {
        achievements = JSON.parse(JSON.stringify(defaultAchievements)); // Deep copy for initial setup
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

    // Sort achievements: earned first, then by name
    const sortedAchievements = [...achievements].sort((a, b) => {
        if (a.earned && !b.earned) return -1;
        if (!a.earned && b.earned) return 1;
        return a.name.localeCompare(b.name);
    });

    sortedAchievements.forEach(ach => {
        const achItem = document.createElement('div');
        achItem.classList.add('achievement-item');
        if (ach.earned) {
            achItem.classList.add('earned');
        }

        let progressBarHtml = '';
        if (ach.type === 'count' && ach.threshold > 0) { // Ensure threshold is positive
            const progressPercentage = Math.min((ach.current / ach.threshold) * 100, 100); // Cap at 100%
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
            displayAchievements(); // Update display after earning
        }
        // Count-based achievements are handled by incrementAchievementProgress
    }
}

function incrementAchievementProgress(id) {
    const achievement = achievements.find(ach => ach.id === id);
    if (achievement && achievement.type === 'count' && !achievement.earned) { // Only increment if not already earned
        achievement.current = (achievement.current || 0) + 1; // Ensure current is a number
        if (achievement.current >= achievement.threshold) {
            achievement.earned = true;
            showAchievementNotification(achievement.name);
        }
        saveAchievements();
        displayAchievements(); // Update display after progress
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
        animation: slideInUpToast 0.5s forwards, fadeOutToast 0.5s 2.5s forwards;
    `;
    notificationDiv.textContent = `🏆 Achievement Unlocked: ${achievementName}!`;
    document.body.appendChild(notificationDiv);

    // Add keyframe styles for notification if not already present
    // Check if the rules already exist to prevent adding duplicates
    let styleSheet = document.getElementById('chatbot-dynamic-styles');
    if (!styleSheet) {
        styleSheet = document.createElement('style');
        styleSheet.id = 'chatbot-dynamic-styles';
        document.head.appendChild(styleSheet);
    }
    
    const keyframes = {
        slideInUpToast: `
            @keyframes slideInUpToast {
                from { opacity: 0; transform: translate(-50%, 50px); }
                to { opacity: 1; transform: translate(-50%, 0); }
            }`,
        fadeOutToast: `
            @keyframes fadeOutToast {
                from { opacity: 1; transform: translate(-50%, 0); }
                to { opacity: 0; transform: translate(-50%, -20px); }
            }`
    };

    for (const [name, rule] of Object.entries(keyframes)) {
        let ruleExists = false;
        for (let i = 0; i < styleSheet.sheet.cssRules.length; i++) {
            if (styleSheet.sheet.cssRules[i].name === name) {
                ruleExists = true;
                break;
            }
        }
        if (!ruleExists) {
            styleSheet.sheet.insertRule(rule, styleSheet.sheet.cssRules.length);
        }
    }


    setTimeout(() => {
        if (notificationDiv.parentNode) { // Check if still in DOM
            notificationDiv.remove();
        }
    }, 3000); // Remove after 3 seconds (0.5s slide in + 2.5s visible/fade out)
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
        speechSynthesis.onvoiceschanged = populateVoiceList; // Directly assign
    }

    // Initial population in case onvoiceschanged fired before listener was set or not supported
    // Also, some browsers (like Chrome on Android) might need a slight delay for voices to be available
    setTimeout(populateVoiceList, 100); // Try after a small delay
    populateVoiceList(); // Try immediately


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
        showAllMemories(); 
    });

    tabAchievements.addEventListener('click', () => {
        tabAchievements.classList.add('active');
        tabMemories.classList.remove('active');
        memoriesContent.style.display = 'none';
        achievementsContent.style.display = 'block';
        displayAchievements(); 
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
        statusElement.textContent = `Error: ${event.error}. Mic off.`;
        console.error("Speech recognition error:", event.error);
        isListening = false; // Ensure listening stops on error
        micButton.classList.remove('listening');
    };
    recognition.onend = () => {
        if (isListening) {
            // If isListening is still true, it means recognition ended unexpectedly
            // (e.g., timeout, but user hasn't clicked stop). Try to restart.
            try {
                recognition.start();
                // micButton should still have 'listening' class
                // statusElement should still say "Listening..."
            } catch (e) {
                // If restart fails, then properly stop.
                console.error("Error restarting speech recognition:", e);
                micButton.classList.remove('listening');
                statusElement.textContent = "Mic off. Click to start.";
                isListening = false;
            }
        } else {
            // If isListening is false, it means user clicked the button to stop, or an error stopped it.
            micButton.classList.remove('listening');
            statusElement.textContent = "Mic off. Click to start.";
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
