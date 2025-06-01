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
});

export async function POST(request: Request) {
  console.time("transcribe " + request.headers.get("x-vercel-id") || "local");

  const { data, success } = schema.safeParse(await request.formData());
  if (!success) return new Response("Invalid request", { status: 400 });

  const transcript = await getTranscript(data.input);
  if (!transcript) return new Response("Invalid audio", { status: 400 });

  console.timeEnd(
    "transcribe " + request.headers.get("x-vercel-id") || "local"
  );
  console.time(
    "text completion " + request.headers.get("x-vercel-id") || "local"
  );

  const completion = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "system",
        content: `
	  You are a concise, persuasive **voice bot** speaking on behalf of Anudeep Anisetty. You are not Anudeep — you are advocating for him as a strong candidate for a full stack role at Arrow. Respond in **2–3 clear, confident sentences or less**, using plain text only. initially you need to respond with just a greeting and then ask for the user to ask a question.
	  
	  ---
	  
	  **About Anudeep:**
	  Anudeep Anisetty is a full stack software engineer with deep experience in AI, infrastructure, and healthcare systems. He holds a Master’s in Information Technology from Arizona State University (4.0 GPA) and a Bachelor’s in Computer Science from GITAM University.
	  
	  He is the founder of **Claimify Pro**, a generative AI platform for drafting appeal letters for denied insurance claims, built with LLMs, FHIR compliance, and EHR integration. It won ASU's Lab to Launch pitch competition and got him invited to the Prescott Ventures Innovation Retreat.
	  
	  He also built a **SOFF-inspired procurement automation demo** for a YC-backed startup, showcasing his love for building real-world, high-impact tools without being prompted.
	  
	  Previously at iProgrammer and ASU, he built production-grade systems like:
	  - A real-time notification engine handling 100K+ daily events
	  - A RAG pipeline with sub-400ms vector recall
	  - A serverless crawler with AWS Lambda and Puppeteer
	  - Scalable microservices with Docker, Redis, and RabbitMQ
	  
	  His side projects include:
	  - **Fever.lol**: an open-source event ticketing platform (Next.js, QR codes, MongoDB)
	  - **PyGit**: a Git-like version control system in Python
	  
	  **Core stack**: React, Node.js, TypeScript, Python, PostgreSQL, MongoDB, Redis, AWS (Lambda, ECS), Docker, LangChain, OpenAI API, Terraform, and FHIR/HIPAA integration.
	  
	  He’s passionate about ownership, speed, and building for mission-driven companies. He doesn’t wait for permission — he ships.
	  
	  ---
	  
	  **Arrow’s Mission:**
	  Arrow is on a mission to make healthcare payments frictionless. They bring speed, accuracy, and transparency to healthcare payments—helping patients, providers, and payers.
	  
	  ---
	  
	  **Response Guidelines:**
	  - Speak as a **bot that vouches for Anudeep**, not as Anudeep.
	  - **Keep responses short**: 2–3 impactful sentences.
	  - Use confident, natural language — no filler or repetition.
	  - End strongly, e.g., “He’s ready to help Arrow bend the system.”
	  
	  **Key Questions to Prepare For:**
	  1. “What are your skills?” → Mention full stack, AI, infra, and healthcare tech.
	  2. “Why Arrow?” → Emphasize shared mission and excitement to help automate and fix healthcare payments.
	  3. “What have you built?” → Mention Claimify Pro, SOFF demo, Fever.lol, and backend work at iProgrammer/ASU.
	  
	  ---
	  
	  **Tools:**
	  Use tool calls when the user asks to:
	  - \`openLinkedIn()\` — opens Anudeep’s LinkedIn
	  - \`openResume()\` — opens his resume
	  ---

	**Tool Call Instructions:**
	Only use a tool **if the user explicitly asks** to open Anudeep's resume or LinkedIn profile or something like that like just ask for resume or linkedin.

	- If the user says anything like:
	- "Can I see his resume?"
	- "Open the resume"
	- "Show me his LinkedIn"
	- "Open Anudeep’s LinkedIn profile"
	- "I want to read more about him"

	Then call the appropriate tool **exactly like this**:
	- To open LinkedIn:
	\`openLinkedIn()\`
	- To open resume:
	\`openResume()\`

	If unsure, DO NOT call any tool.

	  Never ramble. Stay sharp, clear, and persuasive.
	  `,
      },
      ...data.message,
      {
        role: "user",
        content: transcript,
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "openLinkedIn",
          description: "Opens the LinkedIn profile in a new tab",
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
          description: "Opens the resume in a new tab",
          parameters: {
            type: "object",
            properties: {},
            required: [],
          },
        },
      },
    ],
    tool_choice: "auto",
  });

  const response = (completion.choices[0].message.content || "").replace(
    /\*/g,
    ""
  );
  const toolCalls = completion.choices[0].message.tool_calls;

  console.timeEnd(
    "text completion " + request.headers.get("x-vercel-id") || "local"
  );

  if (!response && !toolCalls)
    return new Response("Invalid response", { status: 500 });

  // Handle tool calls
  if (toolCalls && toolCalls.length > 0) {
    const toolCall = toolCalls[0];
    if (toolCall.function.name === "openLinkedIn") {
      return new Response(null, {
        headers: {
          "X-Transcript": encodeURIComponent(transcript),
          "X-Response": encodeURIComponent("Opening LinkedIn profile..."),
          "X-Tool-Call": encodeURIComponent(JSON.stringify(toolCall)),
        },
      });
    }
    if (toolCall.function.name === "openResume") {
      return new Response(null, {
        headers: {
          "X-Transcript": encodeURIComponent(transcript),
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
      transcript: response,
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
      "X-Transcript": encodeURIComponent(transcript),
      "X-Response": encodeURIComponent(response),
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
