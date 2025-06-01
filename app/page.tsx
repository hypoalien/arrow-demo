"use client";

import {
  useActionState,
  useEffect,
  useState,
  startTransition,
} from "react";
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

type Message = {
  role: "user" | "assistant";
  content: string;
  latency?: number;
};

const ScrollingPrompts = () => {
  const controls = useAnimationControls();
  const prompts = [
    'Try saying "Open LinkedIn"',
    'Say "Show me his LinkedIn profile"',
    'Try saying "Show me his resume"',
    'Say "Open his resume"',
    'Say "What are his skills?"',
    'Try saying "Why Arrow?"',
    'Say "What did he build?"',
  ];

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
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
      <div className="relative h-screen w-[800px] overflow-hidden">
        {/* Top gradient mask */}
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-white dark:from-black to-transparent z-10" />

        {/* Bottom gradient mask */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white dark:from-black to-transparent z-10" />

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
              className="group text-center opacity-10 text-4xl font-medium text-neutral-800 dark:text-neutral-200 transition-all duration-300 hover:opacity-20"
            >
              <span className="relative">
                {prompt}
                <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  👆
                </span>
              </span>
            </div>
          ))}
          {/* Second set of prompts (duplicate) */}
          {prompts.map((prompt, index) => (
            <div
              key={`dup-${index}`}
              className="group text-center opacity-10 text-4xl font-medium text-neutral-800 dark:text-neutral-200 transition-all duration-300 hover:opacity-20"
            >
              <span className="relative">
                {prompt}
                <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  👆
                </span>
              </span>
            </div>
          ))}
          {/* Third set of prompts (duplicate) */}
          {prompts.map((prompt, index) => (
            <div
              key={`dup2-${index}`}
              className="group text-center opacity-10 text-4xl font-medium text-neutral-800 dark:text-neutral-200 transition-all duration-300 hover:opacity-20"
            >
              <span className="relative">
                {prompt}
                <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  👆
                </span>
              </span>
            </div>
          ))}
          {/* Fourth set of prompts (duplicate) */}
          {prompts.map((prompt, index) => (
            <div
              key={`dup3-${index}`}
              className="group text-center opacity-10 text-4xl font-medium text-neutral-800 dark:text-neutral-200 transition-all duration-300 hover:opacity-20"
            >
              <span className="relative">
                {prompt}
                <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  👆
                </span>
              </span>
            </div>
          ))}
          {/* Fifth set of prompts (duplicate) for more seamless scrolling */}
          {prompts.map((prompt, index) => (
            <div
              key={`dup4-${index}`}
              className="group text-center opacity-10 text-4xl font-medium text-neutral-800 dark:text-neutral-200 transition-all duration-300 hover:opacity-20"
            >
              <span className="relative">
                {prompt}
                <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  👆
                </span>
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default function Home() {
  const player = usePlayer();
  const [transcription, setTranscription] = useState("");
  const [showArchitecture, setShowArchitecture] = useState(false);

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
      <ScrollingPrompts />
      <div className="h-full flex items-center justify-center p-4 relative z-10">
        <div className="relative w-full max-w-4xl">
          {/* Top gradient mask for main content */}
          <div className="absolute -top-24 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-white/80 dark:to-black/80 z-20" />

          {/* Bottom gradient mask for main content */}
          <div className="absolute -bottom-24 left-0 right-0 h-24 bg-gradient-to-t from-transparent to-white/80 dark:to-black/80 z-20" />

          <div className="relative space-y-6 bg-white/60 dark:bg-black/60 backdrop-blur-sm rounded-xl p-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                Arrow AI Assistant Demo
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-xl mx-auto">
                A voice-enabled AI assistant demonstrating full-stack
                engineering capabilities with real-time speech processing and
                natural language understanding.
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Press{" "}
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                  k
                </kbd>{" "}
                to view architecture
              </p>
            </div>

            {/* Architecture Dialog */}
            <Dialog open={showArchitecture} onOpenChange={setShowArchitecture}>
              <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Project Architecture</DialogTitle>
                  <DialogDescription>
                    A full-stack voice interaction pipeline using
                    state-of-the-art open-source models and APIs
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-8">
                  <div className="relative w-full aspect-[16/9]">
                    <Image
                      src="/image.svg"
                      alt="Project Architecture Diagram"
                      fill
                      className="object-contain rounded-lg"
                    />
                  </div>
                  <div className="space-y-6 text-sm text-neutral-600 dark:text-neutral-400">
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
                  <p className="text-lg">
                    {messages.at(-1)?.content}
                    <span className="text-xs font-mono text-neutral-300 dark:text-neutral-700">
                      {" "}
                      ({messages.at(-1)?.latency}ms)
                    </span>
                  </p>
                </div>
              )}

              {messages.length === 0 && (
                <p>Start talking to interact with the AI assistant.</p>
              )}
            </div>

            {/* Voice Button */}
            <div className="flex justify-center">
              <VoiceButton isListening={vad.userSpeaking} audioLevel={0} />
            </div>

            {/* Transcription display */}
            {transcription && (
              <div className="text-center text-neutral-500 dark:text-neutral-400">
                <p className="text-sm">Transcription:</p>
                <p className="mt-1">{transcription}</p>
              </div>
            )}

            {/* Powered by section */}
            <div className="mt-8 pt-6  dark:border-neutral-800">
              <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                Powered by
              </p>
              <div className="flex flex-wrap justify-center gap-4">
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
