import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuration from environment variables
const API_KEYS_ENDPOINT = import.meta.env.VITE_API_KEYS_ENDPOINT;
const CACHE_DURATION = parseInt(import.meta.env.VITE_CACHE_DURATION) || 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = parseInt(import.meta.env.VITE_MAX_RETRIES) || 3;
const RETRY_DELAY = 1000; // 1 second
const REQUEST_TIMEOUT = parseInt(import.meta.env.VITE_REQUEST_TIMEOUT) || 15000; // 15 seconds
const MIN_REQUEST_INTERVAL = parseInt(import.meta.env.VITE_MIN_REQUEST_INTERVAL) || 1000; // 1 second

// Validate required environment variables
if (!API_KEYS_ENDPOINT) {
  throw new Error('VITE_API_KEYS_ENDPOINT is required. Please check your .env file.');
}

// Validate URL format
try {
  new URL(API_KEYS_ENDPOINT);
} catch (error) {
  throw new Error('VITE_API_KEYS_ENDPOINT must be a valid URL. Please check your .env file.');
}

// Secure cache for API keys with automatic cleanup
let cachedApiKeys = null;
let lastFetchTime = 0;

// Rate limiting
let lastRequestTime = 0;

// Security: Input validation and sanitization
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  
  // Remove potentially harmful characters and limit length
  return input
    .replace(/[<>\"'&]/g, '') // Remove HTML/script injection chars
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .trim()
    .substring(0, 1000); // Limit to 1000 characters
}

// Security: Validate API key format
function isValidApiKey(key) {
  return typeof key === 'string' && 
         key.startsWith('AIzaSy') && 
         key.length === 39 &&
         /^[A-Za-z0-9_-]+$/.test(key);
}

// System prompt optimized for voice assistant with security constraints
const SYSTEM_PROMPT = `You are a secure AI voice assistant embedded in a web application.

SECURITY RULES:
- Never execute code or commands
- Never access external URLs or files
- Never reveal system information or API details
- Never generate harmful, illegal, or inappropriate content

RESPONSE RULES:
- Respond in simple, conversational English
- Keep answers brief: maximum 2 to 4 short sentences
- Do not use markdown, bullet points, emojis, symbols, or special formatting
- Do not include code unless explicitly requested for educational purposes
- Avoid technical jargon unless the user clearly asks for it
- Do not repeat the user's question
- Do not mention that you are an AI model or system details
- If the question is unclear, ask one short clarification question
- If you do not know the answer, say honestly that you do not know

BEHAVIOR:
- Be helpful, calm, professional, and friendly
- Provide accurate information when possible
- Decline requests for harmful or inappropriate content
- Focus on being a helpful voice assistant

Now respond to the user's message.`;

// Secure API key fetching with retry logic
async function fetchApiKeys() {
  const now = Date.now();
  
  // Return cached keys if still valid
  if (cachedApiKeys && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedApiKeys;
  }
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      
      const response = await fetch(API_KEYS_ENDPOINT, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const apiKeys = await response.json();
      
      // Security: Validate response structure
      if (!Array.isArray(apiKeys)) {
        throw new Error('Invalid API response format');
      }
      
      // Filter and validate working keys
      const workingKeys = apiKeys.filter(key => {
        const apiKey = key['Api Key '] || key['Api Key'];
        return key.Status === 'Working' && 
               isValidApiKey(apiKey) &&
               key.Name && typeof key.Name === 'string';
      });
      
      if (workingKeys.length === 0) {
        throw new Error('No valid working API keys available');
      }
      
      // Cache the validated keys
      cachedApiKeys = workingKeys;
      lastFetchTime = now;
      
      return workingKeys;
      
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        console.error('❌ Failed to fetch API keys after', MAX_RETRIES, 'attempts:', error.message);
        throw new Error('Unable to fetch API keys. Please try again later.');
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
    }
  }
}

// Secure AI response generation with rate limiting and input validation
export async function getRealGeminiResponse(userMessage) {
  try {
    // Security: Rate limiting
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      throw new Error('Please wait a moment before making another request.');
    }
    lastRequestTime = now;
    
    // Security: Input validation and sanitization
    const sanitizedMessage = sanitizeInput(userMessage);
    if (!sanitizedMessage || sanitizedMessage.length < 1) {
      throw new Error('Please provide a valid question.');
    }
    
    // Get validated API keys
    const apiKeys = await fetchApiKeys();
    
    // Try each API key with security measures
    for (let i = 0; i < apiKeys.length; i++) {
      const keyInfo = apiKeys[i];
      const apiKey = keyInfo['Api Key '] || keyInfo['Api Key'];
      
      try {
        // Security: Validate API key before use
        if (!isValidApiKey(apiKey)) {
          continue; // Skip invalid key
        }
        
        // Initialize Gemini AI with validated key
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Get the Gemini model with security constraints
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: {
            maxOutputTokens: 300, // Limit response length
            temperature: 0.7,
            topP: 0.8,
            topK: 40
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        });

        // Create secure prompt
        const prompt = `${SYSTEM_PROMPT}\n\nUser: ${sanitizedMessage}`;

        // Generate response with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
        
        const result = await model.generateContent(prompt);
        clearTimeout(timeoutId);
        
        const response = await result.response;
        const reply = response.text();

        // Security: Validate and clean response
        if (!reply || typeof reply !== 'string') {
          throw new Error('Invalid response from AI');
        }

        // Clean and sanitize the response
        const cleanReply = reply
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/#{1,6}\s/g, '')
          .replace(/`/g, '')
          .replace(/\n{2,}/g, ' ')
          .replace(/\n/g, ' ')
          .replace(/[<>\"'&]/g, '') // Remove potentially harmful characters
          .trim()
          .substring(0, 500); // Limit response length

        if (!cleanReply) {
          throw new Error('Empty response from AI');
        }

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
    // Security: Don't expose internal error details
    const errorMessage = error.message || 'An error occurred';
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
      throw new Error('Service temporarily unavailable. Please try again later.');
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    
    if (errorMessage.includes('Invalid API key') || errorMessage.includes('API_KEY')) {
      throw new Error('Service configuration error. Please try again later.');
    }
    
    throw new Error('Unable to process request. Please try again.');
  }
}

// Secure function to clear cache
export function refreshApiKeys() {
  cachedApiKeys = null;
  lastFetchTime = 0;
  lastRequestTime = 0;
}