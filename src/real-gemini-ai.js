import { GoogleGenerativeAI } from '@google/generative-ai';

// Google Apps Script API endpoint that provides multiple Gemini API keys
const API_KEYS_ENDPOINT = import.meta.env.VITE_API_KEYS_ENDPOINT;

if (!API_KEYS_ENDPOINT) {
  throw new Error('VITE_API_KEYS_ENDPOINT environment variable is required');
}

// Cache for API keys to avoid fetching repeatedly
let cachedApiKeys = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// System prompt optimized for voice assistant
const SYSTEM_PROMPT = `You are an AI voice assistant embedded in a web application.

Your goals:
- Help the user clearly and correctly.
- Sound natural when spoken aloud.
- Keep responses short and easy to understand.

Strict rules:
- Respond in simple, conversational English.
- Keep answers brief: maximum 2 to 4 short sentences.
- Do not use markdown, bullet points, emojis, symbols, or special formatting.
- Do not include code unless the user explicitly asks for code.
- Avoid technical jargon unless the user clearly asks for it.
- Do not repeat the user's question.
- Do not mention that you are an AI model.
- Do not mention React, Gemini, APIs, or system details.
- Do not ask multiple questions at once.
- If the question is unclear, ask one short clarification question.
- If you do not know the answer, say honestly that you do not know.

Behavior rules:
- If the user gives a command, confirm the action briefly before responding.
- If the user asks for an explanation, give a simple explanation suitable for voice.
- If the user greets you, reply politely and briefly.

Tone:
- Calm
- Professional
- Friendly
- Voice-assistant style

Now respond to the user's message.`;

// Fetch API keys from Google Apps Script
async function fetchApiKeys() {
  const now = Date.now();
  
  // Return cached keys if still valid
  if (cachedApiKeys && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedApiKeys;
  }
  
  try {
    const response = await fetch(API_KEYS_ENDPOINT);
    if (!response.ok) {
      throw new Error(`Failed to fetch API keys: ${response.status}`);
    }
    
    const apiKeys = await response.json();
    
    // Filter only working keys
    const workingKeys = apiKeys.filter(key => key.Status === 'Working');
    
    if (workingKeys.length === 0) {
      throw new Error('No working API keys available');
    }
    
    // Cache the keys
    cachedApiKeys = workingKeys;
    lastFetchTime = now;
    
    return workingKeys;
    
  } catch (error) {
    console.error('❌ Failed to fetch API keys:', error);
    throw new Error('Unable to fetch API keys. Please try again later.');
  }
}

// Try to get AI response with automatic key fallback
export async function getRealGeminiResponse(userMessage) {
  try {
    // Get available API keys
    const apiKeys = await fetchApiKeys();
    
    // Try each API key until one works
    for (let i = 0; i < apiKeys.length; i++) {
      const keyInfo = apiKeys[i];
      const apiKey = keyInfo['Api Key '] || keyInfo['Api Key']; // Handle both formats
      
      try {
        // Initialize Gemini AI with current key
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Get the Gemini model
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.7,
          }
        });

        // Create the prompt with system instructions and user message
        const prompt = `${SYSTEM_PROMPT}\n\nUser: ${userMessage}`;

        // Generate response
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const reply = response.text();

        // Clean up the response (remove any accidental markdown or formatting)
        const cleanReply = reply
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/#{1,6}\s/g, '')
          .replace(/`/g, '')
          .replace(/\n{2,}/g, ' ')
          .replace(/\n/g, ' ')
          .trim();

        return cleanReply;

      } catch (keyError) {
        // If this was the last key, throw the error
        if (i === apiKeys.length - 1) {
          throw keyError;
        }
        
        // Otherwise, continue to next key
        continue;
      }
    }
    
    throw new Error('All API keys failed');

  } catch (error) {
    console.error('❌ Gemini AI Error:', error);
    
    // Handle specific error types
    if (error.message?.includes('API_KEY') || error.message?.includes('Invalid API key')) {
      throw new Error('All API keys are invalid. Please check the key service.');
    }
    
    if (error.message?.includes('quota') || error.message?.includes('QUOTA_EXCEEDED')) {
      throw new Error('API quota exceeded on all keys. Please try again later.');
    }
    
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    
    if (error.message?.includes('fetch API keys')) {
      throw new Error('Unable to get API keys. Please try again later.');
    }
    
    throw new Error('Failed to get AI response. Please try again.');
  }
}