import os
from huggingface_hub import InferenceClient

# It's recommended to set the HUGGING_FACE_HUB_TOKEN environment variable.
# You can get a token from https://huggingface.co/settings/tokens
DEFAULT_MODEL = "mistralai/Mixtral-8x7B-Instruct-v0.1"
FALLBACK_MODEL = "gpt2-medium"

def get_llm_response(client, user_message):
    """
    Gets a response from the LLM, trying the default model first, then a fallback.
    """
    messages = [{"role": "user", "content": user_message}]
    try:
        print(f"Attempting LLM call with model: {DEFAULT_MODEL}...")
        response = client.chat_completion(
            messages=messages,
            model=DEFAULT_MODEL,
            max_tokens=1000,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error during API call with {DEFAULT_MODEL}: {e}")
        print(f"Trying fallback model {FALLBACK_MODEL}...")
        try:
            response = client.chat_completion(
                messages=messages,
                model=FALLBACK_MODEL,
                max_tokens=300,
                temperature=0.7,
            )
            return response.choices[0].message.content
        except Exception as e_fallback:
            print(f"Error during fallback API call to {FALLBACK_MODEL}: {e_fallback}")
            return "Sorry, I encountered an error trying to connect to the language model."

if __name__ == "__main__":
    print("Simple Chatbot initialized. Type 'quit' to exit.")
    print("This chatbot uses the Hugging Face Inference API.")
    
    token = os.environ.get("HF_TOKEN")
    if not token:
        print("\\nIMPORTANT: The HF_TOKEN environment variable is not set.")
        print("Please get a token from https://huggingface.co/settings/tokens (User Access Token, Read role).")
        print("Then, set it in your terminal before running the script, for example:")
        print("  export HF_TOKEN='your_token_here'  (for Linux/macOS)")
        print("  set HF_TOKEN=your_token_here       (for Windows Command Prompt)")
        print("  $env:HF_TOKEN='your_token_here'    (for Windows PowerShell)")
        token = input("\\nOr, you can paste your Hugging Face API token here (will not be saved): ").strip()

    if not token:
        print("No API token provided. Exiting.")
        exit()

    try:
        client = InferenceClient(token=token)
    except Exception as e:
        print(f"Error initializing InferenceClient: {e}")
        print("Please ensure your token is correct and has the necessary permissions.")
        exit()

    print(f"Using primary model: {DEFAULT_MODEL}, with fallback to {FALLBACK_MODEL}.")
    print("Type your message and press Enter.")

    while True:
        user_input = input("You: ")
        if user_input.lower() == "quit":
            print("Exiting chatbot.")
            break

        if not user_input.strip():
            print("Please enter a message.")
            continue

        llm_response = get_llm_response(client, user_input)
        print(f"Chatbot: {llm_response}")
