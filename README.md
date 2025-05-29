# Simple Command-Line Chatbot

This is a basic command-line chatbot that uses the Hugging Face Inference API to interact with a Large Language Model (LLM).

## Features

-   Connects to Hugging Face Inference API for LLM responses.
-   Uses a primary model (e.g., `mistralai/Mixtral-8x7B-Instruct-v0.1`) with a fallback to a smaller model (e.g., `gpt2-medium`).
-   Prompts for a Hugging Face API token or can use an environment variable (`HF_TOKEN`).
-   Simple interactive command-line interface.

## Setup and Running

1.  **Prerequisites:**
    *   Python 3.7+ and pip.

2.  **Download the files:**
    *   Ensure you have `chatbot.py` and `requirements.txt`.

3.  **Open your terminal or command prompt.**

4.  **Navigate to the project's root directory** (where `chatbot.py` is located).

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

7.  **Set your Hugging Face API Token (Recommended):**
    It's best to set your Hugging Face API token as an environment variable named `HF_TOKEN`.
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
    Replace `"your_actual_hf_api_token"` with your token from [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) (get a User Access Token, typically with "Read" permissions).
    
    If you don't set the environment variable, the script will prompt you to paste the token when you run it.

8.  **Run the chatbot script:**
    ```bash
    python chatbot.py
    ```

## Usage

-   If the `HF_TOKEN` environment variable is not set, the script will prompt you to enter it.
-   Once initialized, type your message and press Enter.
-   The chatbot's response will be displayed.
-   Type "quit" to exit the chatbot.

```
