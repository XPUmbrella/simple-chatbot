# Simple Browser Chatbot

This is a very simple chatbot that runs entirely in your web browser. It uses HTML, CSS, and JavaScript, and does not require any external APIs, backend servers, or API keys. Its responses are pre-programmed in the `script.js` file.

## Features

-   Runs completely client-side (in the browser).
-   No external dependencies after downloading the files.
-   Simple chat interface.
-   Pre-programmed responses based on keywords in user input.
-   Easy to modify by editing `script.js` to add more responses.

## How to Use

1.  **Download the files:**
    *   `index.html`
    *   `style.css`
    *   `script.js`
    Ensure these three files are in the same folder.

2.  **Open `index.html` in your web browser:**
    *   Navigate to the folder where you saved the files.
    *   Double-click `index.html`, or right-click and choose "Open with" your preferred web browser.

3.  **Chat:**
    *   The chat interface will appear.
    *   Type your message in the input field and click "Send" or press Enter.
    *   The chatbot will respond based on its predefined rules.

## Customizing Responses

To change or add to the chatbot's responses:

1.  Open `script.js` in a text editor.
2.  Find the `getBotResponse(userText)` function.
3.  You can add more `else if` conditions to check for different phrases and provide new responses. For example:

    ```javascript
    // Inside getBotResponse function:
    if (lowerUserText.includes('good morning')) {
        return 'Good morning to you too!';
    } else if (lowerUserText.includes('tell me a joke')) {
        return 'Why did the scarecrow win an award? Because he was outstanding in his field!';
    } 
    // ... other rules
    ```

4.  Save the `script.js` file and refresh `index.html` in your browser to see the changes.

## Files

-   `index.html`: The main HTML file for the chat interface.
-   `style.css`: Contains the CSS styles for the appearance of the chat.
-   `script.js`: Contains the JavaScript logic, including how the bot generates responses.
