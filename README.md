# 🔒 Secure AI Voice Assistant

A production-ready, secure React-based voice assistant with WebGL orb visualization powered by Google Gemini AI with multi-key failover system.

## 🛡️ Security Features

✅ **Input Sanitization** - All user inputs are validated and sanitized  
✅ **Rate Limiting** - Prevents API abuse with request throttling  
✅ **API Key Validation** - Validates key format and authenticity  
✅ **Content Filtering** - Gemini safety settings block harmful content  
✅ **Error Sanitization** - No internal system details exposed  
✅ **Secure Headers** - XSS protection and content security  
✅ **No Server Required** - Zero backend attack surface  

## 🚀 Features

✅ **Multi-Key Reliability** - Automatic failover between API keys  
✅ **Real AI Responses** - Google Gemini 2.5 Flash integration  
✅ **Voice Recognition** - Web Speech API with error handling  
✅ **Text-to-Speech** - Natural voice responses  
✅ **WebGL Orb Animation** - Secure visual feedback system  
✅ **Production Ready** - Optimized builds with security headers  

## 🔧 Quick Start

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your Google Apps Script URL

# Check configuration (optional)
npm run check-config

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Open `http://localhost:5173` and click the microphone to start!

## ⚙️ Environment Configuration

Create a `.env` file in the root directory:

```env
# Required: Google Apps Script API endpoint
VITE_API_KEYS_ENDPOINT=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# Optional: Override default settings
VITE_CACHE_DURATION=300000        # 5 minutes (milliseconds)
VITE_MAX_RETRIES=3                # Maximum retry attempts
VITE_REQUEST_TIMEOUT=15000        # 15 seconds (milliseconds)
VITE_MIN_REQUEST_INTERVAL=1000    # 1 second between requests
```

**Note**: The `.env` file is ignored by git for security. Use `.env.example` as a template.

## 🔐 Security Architecture

### Input Validation
- Sanitizes all user inputs to prevent injection attacks
- Limits input length to prevent buffer overflow
- Validates API key formats before use

### Rate Limiting
- 1-second minimum interval between AI requests
- Prevents API abuse and quota exhaustion
- Graceful handling of rate limit errors

### Content Security
- Gemini safety settings block harmful content
- Response sanitization removes potentially dangerous text
- No code execution or external URL access

### Error Handling
- Generic error messages prevent information disclosure
- No internal system details exposed to users
- Secure logging without sensitive data

## 🎯 How It Works

1. **Secure Key Fetch** → Gets validated API keys from Google Apps Script
2. **Input Sanitization** → Cleans and validates user speech input
3. **Rate Limiting** → Ensures responsible API usage
4. **AI Processing** → Secure Gemini API calls with safety settings
5. **Response Cleaning** → Sanitizes AI response for safe display
6. **Voice Output** → Text-to-speech with error handling

## 🌐 Browser Support

- ✅ Google Chrome (Recommended)
- ✅ Microsoft Edge
- ✅ Safari
- ⚠️ Requires Web Speech API support

## 📦 Production Deployment

The app is designed for secure static hosting:

```bash
npm run build
```

Deploy the `dist` folder to:
- Vercel, Netlify, GitHub Pages
- AWS S3 + CloudFront
- Any static hosting service

## 🔒 Security Best Practices

1. **API Key Management**: Uses external service for key rotation
2. **Content Security Policy**: Implemented via build configuration
3. **Input Validation**: All inputs sanitized before processing
4. **Error Handling**: No sensitive information in error messages
5. **Rate Limiting**: Prevents abuse and quota exhaustion

## 🛠️ Technology Stack

- **React 19** - Modern UI framework
- **Vite** - Fast build tool with security optimizations
- **Google Gemini 2.5 Flash** - Secure AI responses
- **Web Speech API** - Browser-native voice processing
- **OGL** - Lightweight WebGL library
- **Terser** - Code minification and obfuscation

## 📄 License

MIT License - See LICENSE file for details

---

**🔒 This project prioritizes security and privacy while delivering a powerful AI voice assistant experience.**
