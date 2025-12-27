import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    // Handle empty or missing message
    if (!message || message.trim() === '') {
      return res.json({
        reply: 'I did not hear anything. Please try again.'
      });
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured');
      return res.status(500).json({
        error: 'Server configuration error',
        reply: 'I am having trouble connecting right now. Please try again later.'
      });
    }

    // Get the Gemini model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.7,
      }
    });

    // Create the prompt with system instructions and user message
    const prompt = `${SYSTEM_PROMPT}\n\nUser: ${message}`;

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

    res.json({ reply: cleanReply });

  } catch (error) {
    console.error('Error processing chat request:', error);

    // Handle specific error types
    if (error.message?.includes('API_KEY')) {
      return res.status(401).json({
        error: 'Invalid API key',
        reply: 'I am having trouble connecting right now. Please try again later.'
      });
    }

    res.status(500).json({
      error: 'Failed to process request',
      reply: 'Sorry, I encountered an error. Please try again.'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎙️  Voice Assistant Server running on http://localhost:${PORT}`);
  console.log(`📡 Chat endpoint: POST http://localhost:${PORT}/chat`);

  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  Warning: GEMINI_API_KEY is not set. Create a .env file with your API key.');
  }
});
