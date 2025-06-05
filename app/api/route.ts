import Groq from "groq-sdk";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { after } from "next/server";

const groq = new Groq();

const schema = zfd.formData({
  input: z.union([zfd.text(), zfd.file()]),
  message: zfd.repeatableOfType(
    zfd.json(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
  ),
  screenFrame: zfd.file().optional(),
});

export async function POST(request: Request) {
  console.time("transcribe " + request.headers.get("x-vercel-id") || "local");

  const { data, success } = schema.safeParse(await request.formData());
  if (!success) return new Response("Invalid request", { status: 400 });

  const transcript = await getTranscript(data.input);
  if (!transcript) return new Response("Invalid audio", { status: 400 });

  // Process screen frame if available
  let screenContext = "";
  let imageContent: { type: "image_url"; image_url: { url: string } } | null =
    null;
  if (data.screenFrame) {
    try {
      // Convert the screen frame to base64 for the LLM
      const buffer = await data.screenFrame.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      imageContent = {
        type: "image_url",
        image_url: {
          url: `data:image/png;base64,${base64}`,
        },
      };
    } catch (error) {
      console.error("Error processing screen frame:", error);
    }
  }

  // Combine all context for the LLM
  const fullContext = transcript;

  console.timeEnd(
    "transcribe " + request.headers.get("x-vercel-id") || "local"
  );
  console.time(
    "text completion " + request.headers.get("x-vercel-id") || "local"
  );

  const response = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "system",
        content: `You are a helpful AI assistant. You have access to the user's screen content and their voice input. Use this context to provide more relevant and contextual responses. When you see an image in the screen context, analyze it and describe what you see to help provide better responses.`,
      },
      ...data.message,
      {
        role: "user",
        content: imageContent
          ? [{ type: "text", text: fullContext }, imageContent]
          : fullContext,
      },
    ],
    temperature: 0.7,
    max_tokens: 150,
    tools: [
      {
        type: "function",
        function: {
          name: "openLinkedIn",
          description: "Opens Anudeep's LinkedIn profile",
          parameters: {
            type: "object",
            properties: {},
            required: [],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "openResume",
          description: "Opens Anudeep's resume",
          parameters: {
            type: "object",
            properties: {},
            required: [],
          },
        },
      },
    ],
  });

  const responseContent = (response.choices[0].message.content || "").replace(
    /\*/g,
    ""
  );
  const toolCalls = response.choices[0].message.tool_calls;

  console.timeEnd(
    "text completion " + request.headers.get("x-vercel-id") || "local"
  );

  if (!responseContent && !toolCalls)
    return new Response("Invalid response", { status: 500 });

  // Handle tool calls
  if (toolCalls && toolCalls.length > 0) {
    const toolCall = toolCalls[0];
    if (toolCall.function.name === "openLinkedIn") {
      return new Response(null, {
        headers: {
          "X-Transcript": encodeURIComponent(fullContext),
          "X-Response": encodeURIComponent("Opening LinkedIn profile..."),
          "X-Tool-Call": encodeURIComponent(JSON.stringify(toolCall)),
        },
      });
    }
    if (toolCall.function.name === "openResume") {
      return new Response(null, {
        headers: {
          "X-Transcript": encodeURIComponent(fullContext),
          "X-Response": encodeURIComponent("Opening resume..."),
          "X-Tool-Call": encodeURIComponent(JSON.stringify(toolCall)),
        },
      });
    }
  }

  console.time(
    "cartesia request " + request.headers.get("x-vercel-id") || "local"
  );

  // const voice ={body:""}
  const voice = await fetch("https://api.cartesia.ai/tts/bytes", {
    method: "POST",
    headers: {
      "Cartesia-Version": "2024-06-30",
      "Content-Type": "application/json",
      "X-API-Key": process.env.CARTESIA_API_KEY!,
    },
    body: JSON.stringify({
      model_id: "sonic-english",
      transcript: responseContent,
      voice: {
        mode: "id",
        id: "79a125e8-cd45-4c13-8a67-188112f4dd22",
      },
      output_format: {
        container: "raw",
        encoding: "pcm_f32le",
        sample_rate: 24000,
      },
    }),
  });

  console.timeEnd(
    "cartesia request " + request.headers.get("x-vercel-id") || "local"
  );

  if (!voice.ok) {
    console.error(await voice.text());
    return new Response("Voice synthesis failed", { status: 500 });
  }

  console.time("stream " + request.headers.get("x-vercel-id") || "local");
  after(() => {
    console.timeEnd("stream " + request.headers.get("x-vercel-id") || "local");
  });

  return new Response(voice.body, {
    headers: {
      "X-Transcript": encodeURIComponent(fullContext),
      "X-Response": encodeURIComponent(responseContent),
    },
  });
}

async function getTranscript(input: string | File) {
  if (typeof input === "string") return input;

  try {
    const { text } = await groq.audio.transcriptions.create({
      file: input,
      model: "whisper-large-v3",
    });

    return text.trim() || null;
  } catch {
    return null;
  }
}
