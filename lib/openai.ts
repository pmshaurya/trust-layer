// lib/openai.ts
//
// OpenAI SDK client singleton.
//
// All API routes import { openai, OPENAI_MODEL } from "@/lib/openai".
// Centralizes API key handling and model selection in ONE place,
// so swapping models or providers is a single-file change.

import OpenAI from "openai";

// Read config from environment. process.env values are always string | undefined.
const apiKey = process.env.OPENAI_API_KEY;

// Fail fast if the key is missing, with a useful error message.
// Better to crash on startup than silently 401 inside a request handler.
if (!apiKey) {
  throw new Error(
    "OPENAI_API_KEY is not set. Add it to .env.local in the project root."
  );
}

/**
 * The OpenAI client used everywhere we need to talk to the API.
 * Imported by all four API routes (analyze-prompt, clarify, generate, validate).
 */
export const openai = new OpenAI({ apiKey });

/**
 * Default model to use across all calls.
 * Override per-call if a specific route needs a cheaper or different model.
 *
 * Falls back to "gpt-4o" if OPENAI_MODEL is not set in env.
 */
export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";
