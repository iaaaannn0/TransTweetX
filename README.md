# TransTweetX

## Project Overview
**TransTweetX** is a precise translation script designed specifically for Twitter/X, offering multilingual translation, Emoji retention, dynamic content loading, and more. With a visual control panel, users can easily select the target language and view translation results in real time. The script uses an intelligent queue system and performance optimization strategies to ensure a smooth user experience.

---

## Features

### 1. **Visual Control Panel**
   - Uses Font Awesome 6 `fa-language` icon.
   - Supports toggle animations for expanding/collapsing.
   - Offers six language options: Chinese, English, 日本語, Русский, Français, Deutsch.
   - Frosted glass effect (`backdrop-filter`) and dark mode compatibility.

### 2. **Precise Translation**
   - Retains Emojis and special characters in tweets.
   - Automatically handles line breaks and excessive spaces.
   - Supports dynamic content loading (infinite scroll).

### 3. **Intelligent Queue System**
   - Uses `Set` to manage the request queue and prevent duplicate requests.
   - Supports automatic retry mechanism (up to 3 attempts).
   - 200ms request interval to avoid rate limiting.

### 4. **Performance Optimization**
   - Optimized `MutationObserver` configuration to monitor dynamic content loading.
   - Separates styles and logic to reduce DOM manipulation.
   - Automatically cleans up completed tasks to free up memory.

### 5. **User Experience**
   - Translation results include loading animations and error messages.
   - Supports real-time translation updates.
   - Automatically adapts to Twitter/X's dark mode.

---

## Implementation Principles

### 1. **Control Panel**
   - Uses icons from `Font Awesome` and CSS for animation effects.
   - Expanding/collapsing the control panel toggles styles using `classList.toggle`.
   - After selecting a language, updates `config.targetLang` and triggers translation refresh.

### 2. **Text Extraction**
   - Uses `cloneNode` to duplicate tweet nodes to avoid affecting original content.
   - Cleans up interfering elements (like links, buttons) via regular expressions and DOM manipulation.
   - Handles line breaks and excessive spaces to ensure correct formatting.

### 3. **Translation Logic**
   - Uses Google Translate API (`translate.googleapis.com`) for translations.
   - Sends requests via `GM_xmlhttpRequest` to avoid cross-origin issues.
   - Supports segmented translations while retaining Emoji and special characters.

### 4. **Dynamic Content Detection**
   - Uses `MutationObserver` to monitor DOM changes.
   - Detects new nodes (`childList`) and text updates (`characterData`).
   - Automatically processes newly loaded tweets.

### 5. **Queue System**
   - Uses `Set` to store tweets in process to prevent duplication.
   - Manages pending translation requests using an array `requestQueue`.
   - Processes requests in sequence with `processQueue` to ensure interval compliance.

---

## Usage Instructions

### Installation Steps
1. Install a browser extension (such as Tampermonkey or Violentmonkey).
2. Create a new script and paste the complete code into the editor.
3. Save the script and refresh the Twitter/X page.

### How to Use
1. Open Twitter/X, and a language icon will appear in the bottom right corner.
2. Click the icon to expand the language menu and select your target language.
3. Existing tweets will automatically be translated, and newly loaded tweets will be processed in real time.

### Configuration Options
In the script's `config` object, you can modify the following parameters:
- `targetLang`: The default target language (e.g., `zh-CN`).
- `languages`: The list of supported languages.
- `translationInterval`: The translation request interval (in milliseconds).
- `maxRetry`: The maximum number of retry attempts.

---

## Code Structure

### Main Functions
- `initControlPanel()`: Initializes the control panel.
- `refreshAllTranslations()`: Refreshes all translation content.
- `processQueue()`: Processes the translation request queue.
- `extractPerfectText(tweet)`: Extracts tweet text.
- `translateWithEmoji(text)`: Segmented translation while retaining Emojis.
- `translateText(text)`: Calls Google Translate API.
- `processTweet(tweet)`: Processes a single tweet.

### Utility Functions
- `delay(ms)`: Delay function to control request interval.
- `createTranslationContainer()`: Creates a container for the translation results.
- `updateTranslation(tweet, translated)`: Updates the displayed translation results.
- `markTranslationFailed(tweet)`: Marks a translation as failed.
