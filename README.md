# Web-Based Voice Chatbot

This is a web-based chatbot that uses the Hugging Face Inference API for Large Language Model (LLM) interaction and supports voice input and output through your browser.

## Features

-   Web interface for chat.
-   Connects to Hugging Face Inference API for LLM responses.
    -   Uses a primary model (e.g., `mistralai/Mixtral-8x7B-Instruct-v0.1`) with a fallback (e.g., `gpt2-medium`).
-   **Voice Input:** Uses the browser's Web Speech API to transcribe your speech to text.
-   **Voice Output:** Uses the browser's Web Speech API to speak the chatbot's responses.
-   Requires a Hugging Face API token (configured via `HF_TOKEN` environment variable).
-   Built with Flask (Python) for the backend and HTML/CSS/JavaScript for the frontend.

## Setup and Running

1.  **Prerequisites:**
    *   Python 3.7+ and pip.
    *   A modern web browser that supports the Web Speech API (e.g., Chrome, Edge).
    *   A connected microphone for voice input.

2.  **Clone the repository (if applicable) or ensure you have all project files:**
    *   `app.py`
    *   `requirements.txt`
    *   `README.md` (this file)
    *   `templates/index.html`
    *   `static/style.css`
    *   `static/script.js`

3.  **Open your terminal or command prompt.**

4.  **Navigate to the project's root directory** (where `app.py` is located).

5.  **Create and activate a virtual environment (recommended):**
    ```bash
    python -m venv venv
    # On macOS/Linux:
    source venv/bin/activate
    # On Windows (Command Prompt):
    # venv\Scripts\activate
    # On Windows (PowerShell):
    # .\venv\Scripts\Activate.ps1
    ```

6.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

7.  **Set your Hugging Face API Token:**
    You **must** set your Hugging Face API token as an environment variable named `HF_TOKEN`. This token is used by the backend to make calls to the LLM.
    *   On macOS/Linux:
        ```bash
        export HF_TOKEN="your_actual_hf_api_token"
        ```
    *   On Windows (Command Prompt):
        ```bash
        set HF_TOKEN=your_actual_hf_api_token
        ```
    *   On Windows (PowerShell):
        ```powershell
        $env:HF_TOKEN="your_actual_hf_api_token"
        ```
    Replace `"your_actual_hf_api_token"` with your token from [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).

8.  **Run the Flask application:**
    ```bash
    python app.py
    ```
    The server will typically start on `http://127.0.0.1:5000/`.

9.  **Open your web browser** and navigate to `http://127.0.0.1:5000/`.

## Usage

-   If the `HF_TOKEN` is not set correctly on the server, an error message will be displayed at the top of the page.
-   **Text Input:** Type your message in the input field and click "Send" or press Enter.
-   **Voice Input:**
    *   Click the "🎤 Speak" button.
    *   Your browser may ask for microphone permission. Please grant it.
    *   The button will change to "🛑 Stop" and a "Listening..." status will appear. Speak clearly.
    *   When you stop speaking, the recognized text will appear in the input field, and the message will be sent automatically.
    *   Click "🛑 Stop" if you want to stop recording manually.
-   The chatbot's responses will appear in the chat area and will also be spoken out loud by your browser.
-   Status messages for voice transcription (e.g., "Listening...", "Heard: ...", errors) will appear below the input area.

## Troubleshooting Common Issues

*   **No LLM Response / Errors on Page:**
    *   Ensure `HF_TOKEN` is set correctly in the terminal *before* starting `python app.py`.
    *   Check the terminal running `app.py` for error messages (e.g., API connection issues, model loading errors).
    *   The first request to a large model on Hugging Face might be slow (cold start).
*   **Voice Input Not Working:**
    *   Make sure your microphone is connected and working.
    *   Grant microphone permission to your browser for the site.
    *   Use a compatible browser (Chrome and Edge generally have good support for Web Speech API).
    *   Check the transcription status area for error messages (e.g., "Audio capture error", "Microphone access denied", "Speech recognition not supported").
*   **Bot Responses Not Spoken:**
    *   Ensure your browser supports speech synthesis.
    *   Check your device's sound output and volume.

## Code Structure

-   `app.py`: Flask backend server, handles LLM interaction.
-   `requirements.txt`: Python dependencies.
-   `templates/index.html`: HTML structure for the chat interface.
-   `static/style.css`: CSS for styling.
-   `static/script.js`: JavaScript for frontend interactivity, voice input/output, and communication with the backend.
```
