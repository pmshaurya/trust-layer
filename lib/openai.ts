import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY is not set. Add it to .env.local in the project root."
  );
}

const genAI = new GoogleGenerativeAI(apiKey);

export const OPENAI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

export const openai = {
  chat: {
    completions: {
      async create(opts: {
        model: string;
        messages: { role: string; content: string }[];
        response_format?: { type: string };
        temperature?: number;
      }) {
        const systemMsg = opts.messages.find((m) => m.role === "system");
        const userMsg = opts.messages.find((m) => m.role === "user");

        const model = genAI.getGenerativeModel({
          model: opts.model,
          systemInstruction: systemMsg?.content,
          generationConfig: {
            temperature: opts.temperature ?? 0.5,
            responseMimeType:
              opts.response_format?.type === "json_object"
                ? "application/json"
                : "text/plain",
          },
        });

        const result = await model.generateContent(userMsg?.content ?? "");
        const text = result.response.text();

        return {
          choices: [
            {
              message: {
                content: text,
              },
            },
          ],
        };
      },
    },
  },
};
