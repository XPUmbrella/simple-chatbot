// --- Speech Recognition ---
function startListening() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert("Sorry, your browser does not support speech recognition.");
    return;
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    document.getElementById('userInput').value = transcript;
    sendMessage();
  };

  recognition.onerror = function(event) {
    alert('Speech recognition error: ' + event.error);
  };

  recognition.start();
}

// --- Speech Synthesis ---
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

// --- Send Message with async Hugging Face Bot Reply ---
async function sendMessage() {
  const input = document.getElementById("userInput");
  const chatlog = document.getElementById("chatlog");
  const userText = input.value.trim();

  if (!userText) return;
  chatlog.innerHTML += `<div><strong>You:</strong> ${userText}</div>`;
  input.value = "";
  chatlog.scrollTop = chatlog.scrollHeight;

  // Show "thinking..." or loading indicator
  chatlog.innerHTML += `<div id="botThinking"><strong>Bot:</strong> ...</div>`;
  chatlog.scrollTop = chatlog.scrollHeight;

  // Get bot reply from Hugging Face
  const botReply = await getBotReply(userText);

  // Replace loading indicator with actual reply
  const botThinkingDiv = document.getElementById("botThinking");
  if (botThinkingDiv) {
    botThinkingDiv.outerHTML = `<div><strong>Bot:</strong> ${botReply}</div>`;
  } else {
    chatlog.innerHTML += `<div><strong>Bot:</strong> ${botReply}</div>`;
  }
  chatlog.scrollTop = chatlog.scrollHeight;

  speakText(botReply);
}

// --- Hugging Face Inference API Call ---
async function getBotReply(message) {
 const API_URL = "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill";
 /* const hfApiKey = "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"; /*// <-- Replace with your key

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hfApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: message })
    });
    const data = await response.json();

    if (data.generated_text) {
      return data.generated_text;
    } else if (Array.isArray(data) && data.length && data[0].generated_text) {
      return data[0].generated_text;
    } else if (data.error) {
      return "Sorry, the AI service is busy. Please try again in a moment.";
    } else {
      return "Sorry, I couldn't get a response from the AI.";
    }
  } catch (err) {
    return "Error reaching the AI service.";
  }
}

// --- Enter Key Listener ---
document.getElementById("userInput").addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault(); // prevent form submission (if any)
    sendMessage();
  }
});
