"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { toast } from "sonner";
import { usePlayer } from "@/lib/usePlayer";
import { track } from "@vercel/analytics";
import { useMicVAD, utils } from "@ricky0123/vad-react";
import { VoiceButton } from "@/components/voice-button";
import { motion, useAnimationControls } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { WordRotate } from "@/components/magicui/word-rotate";

type Message = {
  role: "user" | "assistant";
  content: string;
  latency?: number;
};

const ScrollingPrompts = ({ prompts }: { prompts: string[] }) => {
  const controls = useAnimationControls();

  useEffect(() => {
    const startAnimation = async () => {
      await controls.start({
        y: -2400,
        transition: {
          duration: 30,
          ease: "linear",
          repeat: Infinity,
          repeatType: "loop",
        },
      });
    };
    startAnimation();
  }, [controls]);

  return (
    <div className="fixed inset-0 hidden md:flex items-center justify-center pointer-events-none overflow-hidden z-0">
      <div className="relative h-screen w-full max-w-[800px] overflow-hidden">
        {/* Top gradient mask */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-white/90 via-white/50 to-transparent z-10" />

        {/* Bottom gradient mask */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-white/90 via-white/50 to-transparent z-10" />

        <motion.div
          className="absolute space-y-16 w-full"
          animate={controls}
          style={{
            y: 0,
          }}
        >
          {/* First set of prompts */}
          {prompts.map((prompt, index) => (
            <div
              key={index}
              className="group text-center opacity-20 text-5xl font-medium text-neutral-900 dark:text-neutral-100 transition-all duration-300 hover:opacity-30"
            >
              <span className="relative">
                {prompt}
                <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  👆
                </span>
              </span>
            </div>
          ))}
          {/* Duplicate sets with same mobile responsiveness */}
          {[...Array(4)].map((_, setIndex) =>
            prompts.map((prompt, index) => (
              <div
                key={`dup${setIndex}-${index}`}
                className="group text-center opacity-20 text-5xl font-medium text-neutral-900 dark:text-neutral-100 transition-all duration-300 hover:opacity-30"
              >
                <span className="relative">
                  {prompt}
                  <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    👆
                  </span>
                </span>
              </div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default function Home() {
  const player = usePlayer();
  const [transcription, setTranscription] = useState("");
  const [showArchitecture, setShowArchitecture] = useState(false);

  const scrollingPrompts = [
    'Try saying "Open LinkedIn"',
    'Say "Show me his LinkedIn profile"',
    'Try saying "Show me his resume"',
    'Say "Open his resume"',
    'Say "What are his skills?"',
    'Try saying "Why Arrow?"',
    'Say "What did he build?"',
  ];

  const rotatingPrompts = [
    "Open LinkedIn",
    "Show me his LinkedIn profile",
    "Show me his resume",
    "Open his resume",
    "What are his skills?",
    "Why Arrow?",
    "What did he build?",
  ];

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Check for 'k' key
      if (e.key === "k") {
        e.preventDefault();
        setShowArchitecture(true);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const vad = useMicVAD({
    startOnLoad: true,
    onSpeechEnd: (audio) => {
      player.stop();
      const wav = utils.encodeWAV(audio);
      const blob = new Blob([wav], { type: "audio/wav" });
      startTransition(() => submit(blob));
      const isFirefox = navigator.userAgent.includes("Firefox");
      if (isFirefox) vad.pause();
    },
    positiveSpeechThreshold: 0.6,
    minSpeechFrames: 4,
  });

  const [messages, submit] = useActionState<Array<Message>, Blob>(
    async (prevMessages, data) => {
      const formData = new FormData();
      formData.append("input", data, "audio.wav");
      track("Speech input");

      for (const message of prevMessages) {
        formData.append("message", JSON.stringify(message));
      }

      const submittedAt = Date.now();

      const response = await fetch("/api", {
        method: "POST",
        body: formData,
      });

      const transcript = decodeURIComponent(
        response.headers.get("X-Transcript") || ""
      );
      const text = decodeURIComponent(response.headers.get("X-Response") || "");
      const toolCall = response.headers.get("X-Tool-Call");

      if (!response.ok || !transcript || (!text && !toolCall)) {
        if (response.status === 429) {
          toast.error("Too many requests. Please try again later.");
        } else {
          toast.error((await response.text()) || "An error occurred.");
        }

        return prevMessages;
      }

      const latency = Date.now() - submittedAt;

      // Handle tool calls
      if (toolCall) {
        try {
          const toolCallData = JSON.parse(decodeURIComponent(toolCall));
          console.log("Tool call received:", toolCallData); // Debug log

          if (toolCallData.function.name === "openLinkedIn") {
            // Check if the tab is already open
            const linkedInUrl = "http://linkedin.com/in/anisettyanudeep";
            const existingWindow = window.open("", "_blank");

            if (existingWindow) {
              // If we can open a new window, close it and open LinkedIn
              existingWindow.close();
              window.open(linkedInUrl, "_blank", "noopener,noreferrer");
            } else {
              // If we can't open a new window, the tab might be blocked
              toast.error("Please allow popups to open LinkedIn profile");
            }

            return [
              ...prevMessages,
              {
                role: "user",
                content: transcript,
              },
              {
                role: "assistant",
                content: text || "Opening LinkedIn profile...",
                latency,
              },
            ];
          }

          if (toolCallData.function.name === "openResume") {
            // Check if the tab is already open
            const resumeUrl =
              "https://drive.google.com/file/d/1cja1FQJ4F79ZQ0vIP6C8w_zPbX8qXIhK/view?usp=sharing";
            const existingWindow = window.open("", "_blank");

            if (existingWindow) {
              // If we can open a new window, close it and open resume
              existingWindow.close();
              window.open(resumeUrl, "_blank", "noopener,noreferrer");
            } else {
              // If we can't open a new window, the tab might be blocked
              toast.error("Please allow popups to open resume");
            }

            return [
              ...prevMessages,
              {
                role: "user",
                content: transcript,
              },
              {
                role: "assistant",
                content: text || "Opening resume...",
                latency,
              },
            ];
          }
        } catch (error) {
          console.error("Error parsing tool call:", error);
        }
      }

      if (response.body) {
        player.play(response.body, () => {
          const isFirefox = navigator.userAgent.includes("Firefox");
          if (isFirefox) vad.start();
        });
      }

      setTranscription(transcript);

      return [
        ...prevMessages,
        {
          role: "user",
          content: transcript,
        },
        {
          role: "assistant",
          content: text,
          latency,
        },
      ];
    },
    []
  );

  return (
    <div className="h-screen overflow-hidden relative">
      <ScrollingPrompts prompts={scrollingPrompts} />
      <div className="h-full flex items-center justify-center p-4 relative z-10">
        <div className="relative w-full max-w-4xl">
          {/* Top gradient mask for main content - only show on desktop */}
          <div className="absolute -top-24 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-white/90 dark:to-black/90 z-20 hidden md:block" />

          {/* Bottom gradient mask for main content - only show on desktop */}
          <div className="absolute -bottom-24 left-0 right-0 h-24 bg-gradient-to-t from-transparent to-white/90 dark:to-black/90 z-20 hidden md:block" />

          <div className="relative space-y-4 md:space-y-6 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-xl p-4 md:p-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-xl md:text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                Arrow AI Assistant Demo
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-xs md:text-sm max-w-xl mx-auto">
                A voice-enabled AI assistant demonstrating full-stack
                engineering capabilities with real-time speech processing and
                natural language understanding.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
                <span>Press</span>
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                  k
                </kbd>
                <span>or</span>
                <button
                  onClick={() => setShowArchitecture(true)}
                  className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
                >
                  View Architecture
                </button>
              </div>
            </div>

            {/* Rotating Prompts */}
            <div className="text-center">
              <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                Try asking:
              </p>
              <WordRotate
                words={rotatingPrompts}
                duration={5000}
                className="text-base md:text-lg font-medium text-neutral-500 dark:text-neutral-400"
                motionProps={{
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                  exit: { opacity: 0, y: -20 },
                  transition: { duration: 0.5, ease: "easeInOut" },
                }}
              />
            </div>

            {/* Architecture Dialog */}
            <Dialog open={showArchitecture} onOpenChange={setShowArchitecture}>
              <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl md:text-2xl">
                    Project Architecture
                  </DialogTitle>
                  <DialogDescription className="text-sm md:text-base">
                    A full-stack voice interaction pipeline using
                    state-of-the-art open-source models and APIs
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 md:space-y-8">
                  <div className="relative w-full aspect-[16/9]">
                    <Image
                      src="/image.svg"
                      alt="Project Architecture Diagram"
                      fill
                      className="object-contain rounded-lg"
                    />
                  </div>
                  <div className="space-y-4 md:space-y-6 text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-base text-neutral-800 dark:text-neutral-200">
                        🔉 1. Voice Input (Frontend)
                      </h3>
                      <p>
                        VAD (Voice Activity Detection): Detects when the user
                        starts and stops speaking using vad.ricky0123.com
                        (WebAssembly).
                      </p>
                      <p>
                        Automatically records the audio clip once speech is
                        detected.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold text-base text-neutral-800 dark:text-neutral-200">
                        🔁 2. Speech-to-Text (Backend)
                      </h3>
                      <p>
                        The recorded audio blob is sent to the backend API as a
                        FormData.
                      </p>
                      <p>
                        The backend uses groq.audio.transcriptions.create() with
                        Whisper Large v3 to convert speech into text.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold text-base text-neutral-800 dark:text-neutral-200">
                        💬 3. Text Processing with LLM
                      </h3>
                      <p>
                        The transcript, along with prior conversation context,
                        is sent to Groq&apos;s LLM inference API using:
                      </p>
                      <p>Model: meta-llama/llama-4-scout-17b-16e-instruct</p>
                      <p>
                        Returns a short, confident text reply as a &quot;voice
                        assistant&quot; speaking on behalf of Anudeep Anisetty.
                      </p>
                      <p>
                        Tool functions (openResume(), openLinkedIn()) are added,
                        triggered conditionally via the response.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold text-base text-neutral-800 dark:text-neutral-200">
                        🔊 4. Text-to-Speech
                      </h3>
                      <p>
                        The final LLM-generated reply is sent to Cartesia&apos;s
                        Sonic API for audio synthesis.
                      </p>
                      <p>
                        The TTS model sonic-english converts the message to
                        high-quality PCM float32 audio.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold text-base text-neutral-800 dark:text-neutral-200">
                        🧾 5. Streaming Back to Client
                      </h3>
                      <p>
                        The audio stream is sent back to the browser, where it
                        is played to the user in real-time.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold text-base text-neutral-800 dark:text-neutral-200">
                        ✅ Features
                      </h3>
                      <ul className="list-disc list-inside space-y-2">
                        <li>
                          Zero UI interaction needed — everything is controlled
                          via voice.
                        </li>
                        <li>
                          Ultra-low latency thanks to Groq&apos;s inference
                          speed.
                        </li>
                        <li>
                          Clear separation between stages (VAD → STT → LLM →
                          TTS).
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Messages display area */}
            <div className="text-neutral-400 dark:text-neutral-600 text-center max-w-xl mx-auto text-balance space-y-2">
              {messages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-base md:text-lg">
                    {messages.at(-1)?.content}
                    <span className="text-xs font-mono text-neutral-300 dark:text-neutral-700">
                      {" "}
                      ({messages.at(-1)?.latency}ms)
                    </span>
                  </p>
                </div>
              )}

              {messages.length === 0 && (
                <p className="text-sm md:text-base">
                  Start talking to interact with the AI assistant.
                </p>
              )}
            </div>

            {/* Voice Button */}
            <div className="flex justify-center">
              <VoiceButton isListening={vad.userSpeaking} audioLevel={0} />
            </div>

            {/* Transcription display */}
            {transcription && (
              <div className="text-center text-neutral-500 dark:text-neutral-400">
                <p className="text-xs md:text-sm">Transcription:</p>
                <p className="mt-1 text-sm md:text-base">{transcription}</p>
              </div>
            )}

            {/* GitHub Repository Button */}
            <div className="flex justify-center">
              <a
                href="https://github.com/hypoalien/arrow-demo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                <svg
                  className="w-4 h-4 md:w-5 md:h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                View GitHub Repository
              </a>
            </div>

            {/* Powered by section */}
            <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <p className="text-center text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mb-3 md:mb-4">
                Powered by
              </p>
              <div className="flex flex-wrap justify-center gap-3 md:gap-4 text-xs md:text-sm">
                <a
                  href="https://vercel.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Vercel
                </a>
                <a
                  href="https://www.vad.ricky0123.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  VAD
                </a>
                <a
                  href="https://cartesia.ai/sonic"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Sonic
                </a>
                <a
                  href="https://groq.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Groq (OpenAI Whisper Large v3 + Meta Llama 4)
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
