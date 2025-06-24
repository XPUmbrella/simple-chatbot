let commands = [];
let modal = document.getElementById("commandModal");
let modalBody = document.getElementById("modalBody");
let span = document.getElementsByClassName("close")[0];

// Initialize the chat
document.getElementById("sendButton").addEventListener("click", sendMessage);
document.getElementById("userInput").addEventListener("keypress", function(e) {
    if (e.key === "Enter") sendMessage();
});

document.getElementById("addSpeech").addEventListener("click", () => openModal("speech"));
document.getElementById("addFunction").addEventListener("click", () => openModal("function"));
document.getElementById("showCommands").addEventListener("click", showCommands);

span.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function openModal(type) {
    modalBody.innerHTML = "";
    
    if (type === "speech") {
        modalBody.innerHTML = `
            <h2>Add Speech Command</h2>
            <div class="command-form">
                <label for="triggers">Trigger Phrases (comma separated):</label>
                <input type="text" id="triggers" placeholder="hello,hi,hey">
                
                <label for="response">Response Text:</label>
                <textarea id="response" rows="3"></textarea>
                
                <button onclick="addNewCommand('speech')">Add Command</button>
            </div>
        `;
    } else if (type === "function") {
        modalBody.innerHTML = `
            <h2>Add Function Command</h2>
            <div class="command-form">
                <label for="funcTriggers">Trigger Phrases (comma separated):</label>
                <input type="text" id="funcTriggers" placeholder="time,what time is it">
                
                <label for="funcName">Function Name:</label>
                <input type="text" id="funcName" placeholder="showTime">
                
                <label for="funcCode">Function Code:</label>
                <textarea id="funcCode" rows="5" placeholder="function showTime() { 
    const now = new Date();
    addMessage('bot', `The time is ${now.toLocaleTimeString()}`);
}"></textarea>
                
                <button onclick="addNewCommand('function')">Add Command</button>
            </div>
        `;
    }
    
    modal.style.display = "block";
}

function addNewCommand(type) {
    if (type === "speech") {
        const triggers = document.getElementById("triggers").value.split(',').map(t => t.trim());
        const response = document.getElementById("response").value;
        
        commands.push({
            type: "speech",
            triggers: triggers,
            response: response
        });
    } else if (type === "function") {
        const triggers = document.getElementById("funcTriggers").value.split(',').map(t => t.trim());
        const funcName = document.getElementById("funcName").value;
        const funcCode = document.getElementById("funcCode").value;
        
        // Create the function
        eval(funcCode);
        
        commands.push({
            type: "function",
            triggers: triggers,
            action: window[funcName]
        });
    }
    
    modal.style.display = "none";
    alert("Command added successfully!");
}

function showCommands() {
    modalBody.innerHTML = `
        <h2>Current Commands</h2>
        <div class="command-list">
            ${commands.map((cmd, i) => `
                <div class="command-item">
                    <h3>${cmd.type.toUpperCase()} Command</h3>
                    <p><strong>Triggers:</strong> ${cmd.triggers.join(', ')}</p>
                    ${cmd.type === 'speech' ? `<p><strong>Response:</strong> ${cmd.response}</p>` : ''}
                    <button onclick="deleteCommand(${i})">Delete</button>
                </div>
            `).join('')}
        </div>
    `;
    modal.style.display = "block";
}

function deleteCommand(index) {
    commands.splice(index, 1);
    showCommands();
}

function sendMessage() {
    const userInput = document.getElementById("userInput");
    const message = userInput.value.trim();
    
    if (message !== "") {
        addMessage("user", message);
        userInput.value = "";
        
        // Process commands
        const matchedCommand = commands.find(cmd => 
            cmd.triggers.some(trigger => 
                message.toLowerCase().includes(trigger.toLowerCase())
            )
        );
        
        if (matchedCommand) {
            if (matchedCommand.type === "speech") {
                addMessage("bot", matchedCommand.response);
            } else if (matchedCommand.type === "function") {
                matchedCommand.action();
            }
        } else {
            addMessage("bot", "I didn't understand that command.");
        }
    }
}

function addMessage(sender, message) {
    const chatBox = document.getElementById("chatBox");
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", sender);
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Example function command
function showTime() {
    const now = new Date();
    addMessage("bot", `The current time is ${now.toLocaleTimeString()}`);
}
