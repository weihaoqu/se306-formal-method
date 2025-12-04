import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";
import { Message } from "../types";

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY is missing from environment variables.");
      // In a real app we might throw, but here we'll log it.
    }
    client = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-types' });
  }
  return client;
};

export const sendMessageStream = async (
  history: Message[],
  userMessage: string,
  onChunk: (text: string) => void
): Promise<void> => {
  const ai = getClient();
  
  try {
    // We strictly use the system instruction to set the persona and knowledge base
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        // Appending strict visualization rules to prevent syntax errors in diagrams
        systemInstruction: SYSTEM_PROMPT + "\n\nCRITICAL MERMAID RULES:\n1. ONE STATEMENT PER LINE.\n2. NO NEWLINES inside labels (use <br/>).\n3. ALL labels must be quoted.\n4. Syntax: id[\"label\"].",
        temperature: 0.1, // Lower temperature for strict syntax adherence
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }))
    });

    const result = await chat.sendMessageStream({ message: userMessage });
    
    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        onChunk(text);
      }
    }
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};