# Arrow AI Voice Bot Demo

A full-stack voice-enabled AI assistant demonstrating real-time speech processing with LLM. This project is part of my application for the Full Stack Software Engineer role at Arrow.

## 🚀 Features

- **Voice-First Interaction**: Zero UI interaction needed — everything is controlled via voice
- **Ultra-Low Latency**: Powered by Groq's high-performance inference
- **Real-Time Processing**: End-to-end voice pipeline with minimal delay
- **Modern Tech Stack**: Built with Next.js, TypeScript, and Tailwind CSS

## 🏗️ Architecture

![Project Architecture](/image.png)

The voice bot implements a complete voice interaction pipeline using state-of-the-art open-source models and APIs:

### 1. Voice Input (Frontend)

- Uses VAD (Voice Activity Detection) from vad.ricky0123.com (WebAssembly)
- Automatically detects speech and records audio clips

### 2. Speech-to-Text (Backend)

- Audio processing using Groq's Whisper Large v3 model
- High-accuracy transcription with context awareness

### 3. Text Processing with LLM

- Powered by Groq's Meta Llama 4 model
- Natural language understanding and response generation
- Tool function support (openResume, openLinkedIn)

### 4. Text-to-Speech

- Cartesia's Sonic API for high-quality voice synthesis
- PCM float32 audio output for optimal quality

### 5. Real-Time Streaming

- Seamless audio playback in the browser
- End-to-end streaming pipeline

## 🛠️ Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Voice Processing**: VAD (WebAssembly)
- **AI Models**:
  - Groq (OpenAI Whisper Large v3 + Meta Llama 4)
  - Cartesia Sonic
- **Deployment**: Vercel

## 🚀 Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/arrow-ai-voice-bot-demo.git
   cd arrow-ai-voice-bot-demo
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Then add your API keys to `.env.local`:

   ```
   GROQ_API_KEY=your_groq_api_key
   CARTESIA_API_KEY=your_cartesia_api_key
   ```

4. Start the development server:

   ```bash
   bun dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🎯 Usage

1. Click the voice button or press 'k' to view the architecture
2. Start speaking when the button is active
3. The AI will process your speech and respond in real-time
4. Try commands like:
   - "Open LinkedIn"
   - "Show me his resume"
   - "What are his skills?"
   - "Why Arrow?"

## 🔑 API Keys Required

- **Groq API Key**: For speech-to-text and LLM processing
- **Cartesia API Key**: For text-to-speech synthesis

## 🏗️ Project Structure

```
├── app/
│   ├── api/         # Backend API routes
│   ├── page.tsx     # Main application page
│   └── layout.tsx   # Root layout
├── components/      # React components
├── lib/            # Utility functions
└── public/         # Static assets
```

## 🤝 Contributing

This is a demo project for my application to Arrow. Feel free to explore the code and learn from it!

## 📝 License

MIT License - feel free to use this code for learning purposes.
