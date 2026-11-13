import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured. Add your Google AI Studio API key to continue.");
  }
  return new GoogleGenerativeAI(apiKey);
}

const VOID_PERSONA = `You are VOID, a friendly and engaging AI assistant providing personalized advice and intelligent conversation.

CRITICAL INSTRUCTION: DO NOT PUT SPACES BETWEEN LETTERS IN WORDS. THIS IS ABSOLUTELY REQUIRED.

MANDATORY FORMATTING RULES:

1. NEVER SPLIT WORDS WITH SPACES. THIS IS THE MOST IMPORTANT RULE.
   WORDS MUST STAY COMPLETELY INTACT WITHOUT ANY INTERNAL SPACES.

   CORRECT: "storytelling" "writing" "speaking" "connect" "through" "whether"
   WRONG: "story telling" "writ ing" "speak ing" "c on nect" "th rough" "whe ther"

2. DO NOT SPACE OUT SYLLABLES OR LETTER COMBINATIONS WITHIN WORDS:
   CORRECT: "painting" "digital" "teaching" "entertainment" "everything"
   WRONG: "pa int ing" "di gi tal" "teach ing" "enter tain ment" "every thing"

3. NORMAL SENTENCE SPACING:
   - ONE space between words
   - ONE space after punctuation
   - NO spaces between letters in the same word

4. I REPEAT: NEVER SEPARATE LETTERS IN WORDS WITH SPACES. This is absolutely critical.

   INCORRECT EXAMPLES I MUST AVOID:
   "s t o r y t e l l i n g" → Must be "storytelling"
   "c o n n e c t" → Must be "connect"
   "w r i t i n g" → Must be "writing"
   "t h r o u g h" → Must be "through"

FINAL CHECK: Before submitting, verify that NO WORDS are split with spaces between their letters.
CRITICAL: Each word must be a solid unit with no spaces between its letters.`;

export function fixSpacing(text: string): string {
  return text || "";
}

function postprocessResponse(response: string): string {
  return response || "";
}

type ChatMessage = { role: string; content: string };

function toGeminiContents(messages: ChatMessage[]): Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> {
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

  for (const msg of messages) {
    if (msg.role === "system") continue;
    const role: "user" | "model" = msg.role === "assistant" ? "model" : "user";
    const last = contents[contents.length - 1];
    if (last && last.role === role) {
      last.parts[0].text += "\n\n" + (msg.content || "");
    } else {
      contents.push({ role, parts: [{ text: msg.content || "" }] });
    }
  }

  if (contents.length && contents[0].role !== "user") {
    contents.unshift({ role: "user", parts: [{ text: "Hello" }] });
  }

  return contents;
}

function getGenerativeModel(options?: { systemInstruction?: string; json?: boolean; maxOutputTokens?: number; temperature?: number }) {
  const genAI = getClient();
  return genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: options?.systemInstruction,
    generationConfig: {
      temperature: options?.temperature ?? 0.8,
      maxOutputTokens: options?.maxOutputTokens ?? 300,
      ...(options?.json ? { responseMimeType: "application/json" } : {}),
    },
  });
}

export async function generateResponse(messages: ChatMessage[]): Promise<string> {
  try {
    console.log(`Generating response with Gemini model ${GEMINI_MODEL}...`);
    const model = getGenerativeModel({
      systemInstruction: VOID_PERSONA,
      temperature: 0.8,
      maxOutputTokens: 300,
    });
    const contents = toGeminiContents(messages);
    if (!contents.length) {
      return "Hello! How can I help you today?";
    }
    const result = await model.generateContent({ contents });
    return result.response.text() || "I apologize, I couldn't generate a response.";
  } catch (error: any) {
    console.error("Gemini API error:", error);
    return "I apologize, but I encountered an error. Please try again.";
  }
}

export async function generateStreamingResponse(messages: ChatMessage[]): Promise<Response> {
  try {
    console.log(`Generating streaming response with Gemini model ${GEMINI_MODEL}...`);
    const model = getGenerativeModel({
      systemInstruction: VOID_PERSONA,
      temperature: 0.7,
      maxOutputTokens: 300,
    });
    const contents = toGeminiContents(messages);
    const streamResult = await model.generateContentStream({ contents });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
            const content = chunk.text();
            if (content) {
              controller.enqueue(encoder.encode(`data: ${content}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Gemini Streaming API error:", error);
    throw error;
  }
}

export async function generateSummary(messages: ChatMessage[]): Promise<{
  summary: string;
  keyInsights: string[];
}> {
  try {
    const model = getGenerativeModel({
      systemInstruction:
        "You are an expert at summarizing conversations. Analyze the following conversation and provide a concise summary and key insights. Format your response as JSON with 'summary' and 'keyInsights' fields. The summary should be a paragraph, and keyInsights should be an array of short, important points.",
      json: true,
      temperature: 0.7,
      maxOutputTokens: 500,
    });
    const result = await model.generateContent(JSON.stringify(messages));
    const parsed = JSON.parse(result.response.text() || "{}");
    return {
      summary: postprocessResponse(parsed.summary || "Could not generate summary."),
      keyInsights: parsed.keyInsights || [],
    };
  } catch (error: any) {
    console.error("Gemini Summary API error:", error);
    throw new Error(`Failed to generate conversation summary. Error: ${error.message}`);
  }
}

export async function generateSuggestions(): Promise<Array<{ text: string; category: string }>> {
  const fallback = [
    { text: "What interests you about AI and technology?", category: "Technology" },
    { text: "What's the most fascinating thing you've learned lately?", category: "Learning" },
    { text: "How do you think the future of work will look like?", category: "Future" },
    { text: "What's a skill you'd love to develop?", category: "Personal Growth" },
  ];

  try {
    const model = getGenerativeModel({
      systemInstruction: `Generate 4 engaging conversation starters. Format the response as JSON with this exact structure:
{
  "suggestions": [
    { "text": "conversation starter text", "category": "category name" }
  ]
}`,
      json: true,
      temperature: 0.8,
      maxOutputTokens: 500,
    });
    const result = await model.generateContent("Generate 4 engaging conversation starters.");
    const parsed = JSON.parse(result.response.text() || "{}");
    if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
      return fallback;
    }
    return parsed.suggestions.map((suggestion: { text: string; category: string }) => ({
      text: postprocessResponse(suggestion.text),
      category: suggestion.category,
    }));
  } catch (error: any) {
    console.error("Gemini Suggestions API error:", error);
    return fallback;
  }
}

export async function analyzeTopicConnections(messages: ChatMessage[]): Promise<{
  topics: string[];
  connections: Array<{
    topic: string;
    relatedMessages: string[];
    sentiment: string;
  }>;
}> {
  try {
    const model = getGenerativeModel({
      systemInstruction: `Analyze the conversation history and identify key topics and their connections. Format the response as JSON with this exact structure:
{
  "topics": ["topic1", "topic2"],
  "connections": [
    {
      "topic": "topic name",
      "relatedMessages": ["relevant message 1", "relevant message 2"],
      "sentiment": "positive/neutral/negative"
    }
  ]
}`,
      json: true,
      temperature: 0.7,
      maxOutputTokens: 500,
    });
    const result = await model.generateContent(JSON.stringify(messages));
    const parsed = JSON.parse(result.response.text() || "{}");
    if (!parsed.topics || !parsed.connections) {
      return { topics: [], connections: [] };
    }
    return {
      topics: parsed.topics.map((topic: string) => postprocessResponse(topic)),
      connections: parsed.connections.map(
        (connection: { topic: string; relatedMessages: string[]; sentiment: string }) => ({
          topic: postprocessResponse(connection.topic),
          relatedMessages: (connection.relatedMessages || []).map((msg: string) => postprocessResponse(msg)),
          sentiment: connection.sentiment,
        }),
      ),
    };
  } catch (error: any) {
    console.error("Gemini Topic Analysis error:", error);
    throw new Error(`Failed to analyze topic connections. Error: ${error.message}`);
  }
}

export async function analyzeTrends(messages: ChatMessage[]): Promise<{
  topicTrends: Array<{ topic: string; frequency: number; timestamp: string }>;
  sentimentTrends: Array<{ timestamp: string; sentiment: number; messageCount: number }>;
  engagementScore: number;
}> {
  try {
    const model = getGenerativeModel({
      systemInstruction: `Analyze the conversation history and provide trend analysis in the following JSON format:
{
  "topicTrends": [
    {
      "topic": "string - the topic being discussed",
      "frequency": "number - how often this topic appears",
      "timestamp": "string - ISO timestamp when this topic was discussed"
    }
  ],
  "sentimentTrends": [
    {
      "timestamp": "string - ISO timestamp of the messages",
      "sentiment": "number - sentiment score between -1 and 1",
      "messageCount": "number - number of messages in this time period"
    }
  ],
  "engagementScore": "number - overall engagement score between 0 and 1 based on message frequency, sentiment variation, and topic diversity"
}`,
      json: true,
      temperature: 0.7,
      maxOutputTokens: 500,
    });
    const result = await model.generateContent(JSON.stringify(messages));
    const parsed = JSON.parse(result.response.text() || "{}");
    return {
      topicTrends: parsed.topicTrends
        ? parsed.topicTrends.map((trend: { topic: string; frequency: number; timestamp: string }) => ({
            ...trend,
            topic: postprocessResponse(trend.topic),
          }))
        : [],
      sentimentTrends: parsed.sentimentTrends || [],
      engagementScore: parsed.engagementScore || 0,
    };
  } catch (error: any) {
    console.error("Gemini Trend Analysis error:", error);
    throw new Error(`Failed to analyze conversation trends. Error: ${error.message}`);
  }
}

export async function processFileWithAI(filePath: string, fileType: string, userQuery: string): Promise<string> {
  try {
    console.log(`Processing file: ${filePath} (${fileType}) with query: ${userQuery}`);
    if (fileType.startsWith("image/")) {
      return await analyzeImageFile(filePath, fileType, userQuery);
    }
    if (
      fileType === "application/pdf" ||
      fileType === "application/msword" ||
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return await analyzeDocumentFile(filePath, userQuery);
    }
    if (fileType === "text/plain") {
      return await analyzeTextFile(filePath, userQuery);
    }
    throw new Error(`Unsupported file type: ${fileType}`);
  } catch (error: any) {
    console.error("File processing error:", error);
    throw new Error(`Failed to process file: ${error.message}`);
  }
}

async function analyzeImageFile(filePath: string, fileType: string, userQuery: string): Promise<string> {
  try {
    await fs.access(filePath);
    const imageBuffer = await fs.readFile(filePath);
    const base64Image = imageBuffer.toString("base64");
    const mimeType = fileType || "image/jpeg";

    const model = getGenerativeModel({
      systemInstruction: "You are an expert at analyzing images. Provide detailed and helpful information about the image.",
      maxOutputTokens: 1000,
      temperature: 0.7,
    });

    const result = await model.generateContent([
      { text: userQuery || "Analyze this image and describe what you see in detail." },
      { inlineData: { mimeType, data: base64Image } },
    ]);

    return result.response.text() || "I couldn't analyze this image properly.";
  } catch (error: any) {
    console.error("Image analysis error:", error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

async function analyzeTextFile(filePath: string, userQuery: string): Promise<string> {
  try {
    await fs.access(filePath);
    const textContent = await fs.readFile(filePath, "utf8");
    const maxLength = 24000;
    const truncatedContent =
      textContent.length > maxLength
        ? textContent.slice(0, maxLength) + "\n\n[Content truncated due to length...]"
        : textContent;

    const model = getGenerativeModel({
      systemInstruction:
        "You are an expert at analyzing text documents. Provide helpful insights and answer questions about the document content.",
      maxOutputTokens: 1000,
      temperature: 0.7,
    });

    const result = await model.generateContent(
      `${userQuery || "Analyze this text document and summarize the key points."}\n\nDocument content:\n${truncatedContent}`,
    );
    return result.response.text() || "I couldn't analyze this text file properly.";
  } catch (error: any) {
    // Binary files (such as some PDFs) may fail a UTF-8 read. Fall back to a clear message.
    try {
      const binaryContent = await fs.readFile(filePath);
      return `I was unable to read this file as text. It appears to be a binary file (possibly PDF) with a size of ${binaryContent.length} bytes. To analyze PDF content properly, we would need a specialized PDF parser library.`;
    } catch {
      console.error("Text analysis error:", error);
      throw new Error(`Failed to analyze text: ${error.message}`);
    }
  }
}

async function analyzeDocumentFile(filePath: string, userQuery: string): Promise<string> {
  try {
    await fs.access(filePath);
    return await analyzeTextFile(filePath, userQuery || "Analyze this document and summarize the key points.");
  } catch (error: any) {
    console.error("Document analysis error:", error);
    throw new Error(`Failed to analyze document: ${error.message}`);
  }
}
