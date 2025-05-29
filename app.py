import os
from flask import Flask, render_template, request, jsonify
from huggingface_hub import InferenceClient

app = Flask(__name__)

# Configure Hugging Face API token
# It's strongly recommended to set this as an environment variable
HF_API_TOKEN = os.environ.get("HF_TOKEN")
DEFAULT_MODEL = "mistralai/Mixtral-8x7B-Instruct-v0.1" # or another suitable model

# Initialize InferenceClient
# We'll do this more robustly later, perhaps per-request or on app start if token is present
client = None
if HF_API_TOKEN:
    try:
        client = InferenceClient(token=HF_API_TOKEN)
    except Exception as e:
        print(f"Error initializing InferenceClient on startup: {e}")
        # The app can still run, but /chat endpoint will fail until token is valid/provided
else:
    print("Warning: HF_TOKEN environment variable not set. LLM calls will fail.")

@app.route('/')
def index():
    return render_template('index.html', error_message="HF_TOKEN not set. Please set it to use the chatbot." if not HF_API_TOKEN else None)

def get_llm_response(user_message):
    if not client:
        return "LLM client not initialized. Is HF_TOKEN set correctly on the server?"

    messages = [{"role": "user", "content": user_message}]
    current_model = DEFAULT_MODEL
    try:
        print(f"Attempting LLM call with model: {current_model}")
        response = client.chat_completion(
            messages=messages,
            model=current_model,
            max_tokens=1000,  # Increased max_tokens for potentially longer responses
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error during API call with {current_model}: {e}")
        
        # Attempt fallback to gpt2-medium
        fallback_model = "gpt2-medium"
        print(f"Trying fallback model: {fallback_model}...")
        try:
            response = client.chat_completion(
                messages=messages,
                model=fallback_model,
                max_tokens=300,  # Adjusted for a potentially smaller model
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e_fallback:
            print(f"Error during fallback API call to {fallback_model}: {e_fallback}")
            return "Sorry, I encountered an error connecting to the language model after trying primary and fallback options."


@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message')

    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

    if not HF_API_TOKEN:
         return jsonify({'reply': "Hugging Face API token (HF_TOKEN) is not configured on the server."})

    if not client:
        # This case might happen if token was set but client init failed.
        return jsonify({'reply': "LLM Inference Client is not initialized on the server. Check server logs."})

    bot_reply = get_llm_response(user_message)
    return jsonify({'reply': bot_reply})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
