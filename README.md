# 📖 Notion Word Saver

A browser extension that helps you learn new words while browsing the web. Highlight any text to get an **instant AI translation** and save it to your **Notion** page — all in one click.

## ✨ Features

- **Highlight & Translate** — Select any text on a webpage and instantly see the translation powered by Google Gemini AI
- **Save to Notion** — Click "Save to Notion" to store both the original text and its translation to your Notion page
- **Auto-organized by date** — Saved words are grouped into daily sub-pages (e.g. `16/03/2026`) for easy review
- **Formatted entries** — Each entry is saved as: **original text** — _translation_
- **16 languages supported** — English, Ukrainian, Russian, German, Spanish, French, Italian, Portuguese, Polish, Dutch, Japanese, Chinese, Korean, Arabic, Turkish, Hindi
- **Works on any website** — Content script runs on all pages

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- A [Notion](https://www.notion.so/) account
- A [Gemini API Key](https://aistudio.google.com/apikey)

### Installation

```bash
git clone https://github.com/weeny-V/english-extension.git
cd english-extension
npm install
```

### Run in Development

```bash
npm run dev
```

This opens a Chromium browser with the extension auto-loaded. Changes hot-reload automatically.

### Build for Production

```bash
npm run build
```

The production-ready extension will be in `dist/chrome/`. You can load it manually in Chrome:

1. Go to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/chrome/` folder

## ⚙️ Configuration

After installing the extension, click the extension icon in your browser toolbar to open the settings popup.

### 1. Notion Setup

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations) → **New integration**
2. Copy the **Integration Token** (starts with `secret_`)
3. Open your target Notion **page** → click `•••` → **Connections** → add your integration
4. Copy the **Page ID** from the URL:
   ```
   https://www.notion.so/Your-Page-[PAGE_ID]?v=...
   ```
5. Paste the **Token** and **Page ID** into the extension popup

### 2. Gemini AI Setup

1. Get a free API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Paste the key into the **Gemini API Key** field in the extension popup

### 3. Language Settings

Select your **source language** (the language of text you'll highlight) and **target language** (the language to translate into).

### 4. Save Settings

Click **"Save All Settings"** and optionally test the Notion connection.

## 📝 How to Use

1. **Highlight** any text on a webpage
2. A **translation tooltip** appears below showing the translated text
3. A **"Save to Notion"** button appears above the selection
4. Click the button to save both the original and translation to Notion
5. Words are saved to a daily sub-page under your configured Notion page

## 🗂 Project Structure

```
eng-ext/
├── src/
│   ├── background.js        # Service worker: Notion API + Gemini translation
│   ├── manifest.json         # Extension manifest (MV3)
│   ├── content/
│   │   ├── index.js          # Content script: text selection UI
│   │   └── styles.css        # Tooltip & button styles
│   └── popup/
│       ├── index.html        # Popup entry point
│       ├── PopupApp.tsx       # Settings UI (React)
│       └── styles.css        # Popup styles
├── public/
│   └── screenshot.png
├── extension.config.js       # Extension.js config
├── package.json
└── tsconfig.json
```

## 🌐 Browser Support

| Browser  | Command                            |
| -------- | ---------------------------------- |
| Chromium | `npm run dev` (default)            |
| Chrome   | `npm run dev -- --browser=chrome`  |
| Edge     | `npm run dev -- --browser=edge`    |
| Firefox  | `npm run dev -- --browser=firefox` |

## 🛠 Tech Stack

- [Extension.js](https://extension.js.org/) — Build framework for browser extensions
- [React 18](https://react.dev/) — Popup settings UI
- [Notion SDK](https://github.com/makenotion/notion-sdk-js) — Notion API client
- [Google GenAI](https://ai.google.dev/) — Gemini AI for translations

## 📄 License

MIT
