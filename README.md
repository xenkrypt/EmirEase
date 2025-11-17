# EmirEase: AI-Powered Government Services Assistant

EmirEase is an AI-powered, multimodal digital assistant designed to help Dubai’s diverse population—especially expatriates—navigate complex government procedures with ease. It enables users to upload official documents, get real-time extraction and translation of key information, receive step-by-step guidance through government workflows, and simulate verification checks—all in multiple languages.

This intelligent agent aims to demystify bureaucracy, making essential services more accessible and less intimidating for everyone.

## ✨ Core Features

### 1. Multimodal Document Analysis
- **Versatile Uploads:** Upload documents via file browser, drag-and-drop, clipboard paste, or direct camera capture.
- **Broad Format Support:** Handles multiple file types including PDF, JPG, and PNG.
- **AI Data Extraction:** Intelligently extracts key information like names, dates, ID numbers, and especially expiry dates.
- **Cross-Validation:** When multiple documents are uploaded, the AI cross-references key data points to check for consistency.
- **Automated Workflow Generation:** Instantly generates a clear, step-by-step workflow for the most relevant government process related to your document.

### 2. Interactive AI Assistants
- **Contextual Chat:** Ask follow-up questions about your analyzed documents in a natural, conversational way.
- **Service Simulation:** Engage in an interactive, guided simulation of complex government services (e.g., Emirates ID Renewal, Golden Visa Application). This feature uses a RAG pipeline to provide accurate, context-aware responses.

### 3. Advanced Text Tools
- **Summarize:** Get a concise summary of long texts.
- **Translate:** Translate text snippets into any of the supported languages.
- **Extract Keywords:** Pull out the most important keywords from a block of text.
- **Correct Grammar:** Clean up spelling and grammar mistakes instantly.

### 4. Privacy & Personalization
- **PII Redaction:** One-click redaction of Personally Identifiable Information (names, photos, ID numbers) from documents before exporting.
- **Digital Signatures:** Sign your documents digitally directly within the application.
- **Multi-Language Support:** Full UI and AI support for **Arabic, English, Hindi, Malayalam, and Urdu**.
- **Theming:** Switch between **Light**, **Dark**, and **Eye Care (Sepia)** modes for comfortable viewing.
- **Expiration Alerts:** Proactively notifies you of documents that are nearing their expiration date.

### 5. Convenience & Accessibility
- **PDF Export:** Download your analysis, checklists, and signed/redacted documents as a clean PDF.
- **Voice Interaction:** Use voice input (speech-to-text) and listen to AI responses (text-to-speech) for a hands-free experience.

## 🚀 Use Cases

- **Visa Renewal:** An expat uploads their visa and passport. EmirEase extracts their name, visa expiry date, and passport number, confirms they match, and generates a translated, step-by-step guide for renewal.
- **Traffic Fine Payment:** A tourist pastes a screenshot of a traffic fine. The app translates it, explains the violation, and provides a workflow to pay it online, including links to the official portal.
- **Golden Visa Inquiry:** A professional uses the Service Simulation to ask complex eligibility questions. The AI agent, backed by a knowledge base, provides accurate, detailed answers to guide their application.

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS
- **AI Engine:** Google Gemini API (`@google/genai`)
  - **`gemini-2.5-flash`:** Powers high-speed document analysis, text utilities, and contextual chat.
  - **`gemini-2.5-pro`:** Drives the advanced reasoning for the "Opus" Service Simulation agent.
- **RAG Pipeline:** A simulated vector database (`services/qdrantService.ts`) enables Retrieval-Augmented Generation for the service simulation, ensuring high-quality, relevant responses.
- **Web APIs:**
  - **Speech Recognition & Synthesis:** For voice-based interactions.
  - **Canvas API:** For digital signatures and PII redaction on images.

## ⚙️ Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge).
- A Google Gemini API key.

### Running the Application
This project is built with a modern, no-build-step setup using import maps.

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```

2.  **Set up the Environment:**
    The application requires the Gemini API key to be available as an environment variable. You will need to configure your local server to expose `process.env.API_KEY`.
    *Note: For a production deployment, this key should be handled by a secure backend proxy to avoid exposing it on the client-side.*

3.  **Serve the files:**
    Use any simple local web server to serve the project's root directory. A popular choice is `serve`:
    ```bash
    # If you don't have serve, install it globally
    npm install -g serve

    # Run the server
    serve
    ```

4.  **Open in Browser:**
    Navigate to the local address provided by your server (e.g., `http://localhost:3000`).

## 📁 Project Structure

```
.
├── components/          # Reusable React components
│   ├── tabs/            # Components for each main tab
│   ├── icons/           # SVG icon components
│   └── ...              # UI elements like Modals, Loaders, etc.
├── hooks/               # Custom React hooks (e.g., useTheme)
├── services/            # API communication layer
│   ├── geminiService.ts # All interactions with the Gemini API
│   └── qdrantService.ts # Simulated vector DB for RAG
├── types.ts             # TypeScript type definitions
├── constants.ts         # App-wide constants (languages, limits)
├── App.tsx              # Main application component with routing
├── index.tsx            # Entry point for React application
└── index.html           # Main HTML file with import maps
```
