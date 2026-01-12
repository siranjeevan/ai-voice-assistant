import { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import Orb from './components/Orb/Orb';
import { getRealGeminiResponse } from './real-gemini-ai.js';

// Check for browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const speechSynthesis = window.speechSynthesis;

function App() {
  // State
  const [status, setStatus] = useState('idle'); // idle, listening, processing, speaking, error
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');

  // Refs
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  // Check browser support
  const isSupported = SpeechRecognition && speechSynthesis;

  // Speak the response using SpeechSynthesis
  const speakResponse = useCallback((text) => {
    if (!speechSynthesis) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to use a good voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.name.includes('Google') ||
      v.name.includes('Samantha') ||
      v.name.includes('Daniel') ||
      v.lang.startsWith('en')
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setStatus('speaking');
    };

    utterance.onend = () => {
      setStatus('idle');
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setStatus('idle');
    };

    synthRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, []);

  // Send transcript to REAL Gemini AI
  const sendToBackend = useCallback(async (text) => {
    setStatus('processing');

    try {
      // Get real AI response from Gemini
      const reply = await getRealGeminiResponse(text);

      setResponse(reply);
      speakResponse(reply);

    } catch (err) {
      console.error('Gemini AI Error:', err);
      setError(err.message || 'Failed to get AI response. Please try again.');
      setStatus('error');
    }
  }, [speakResponse]);

  // Initialize speech recognition
  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setStatus('listening');
      setError('');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentText = finalTranscript || interimTranscript;
      setTranscript(currentText);
      // Store in ref so onend can access it
      if (recognitionRef.current) {
        recognitionRef.current.lastTranscript = currentText;
      }
    };

    recognition.onend = () => {
      // Only process if we should and have a transcript
      if (recognitionRef.current?.shouldProcess) {
        recognitionRef.current.shouldProcess = false;
        const currentTranscript = recognitionRef.current.lastTranscript;
        if (currentTranscript && currentTranscript.trim()) {
          sendToBackend(currentTranscript);
        } else {
          setStatus('idle');
          setResponse('I did not hear anything. Please try again.');
        }
      } else {
        setStatus('idle');
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);

      let errorMessage = 'An error occurred with speech recognition.';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech was detected. Please try again.';
          setResponse('I did not hear anything. Please try again.');
          break;
        case 'audio-capture':
          errorMessage = 'No microphone was found. Please check your microphone.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access was denied. Please allow microphone access and try again.';
          break;
        case 'aborted':
          // User aborted, no error to show
          setStatus('idle');
          return;
        default:
          errorMessage = `Error: ${event.error}`;
      }

      setError(errorMessage);
      setStatus('error');
    };

    recognitionRef.current = recognition;
    recognitionRef.current.shouldProcess = false;
    recognitionRef.current.lastTranscript = '';

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [sendToBackend]);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    // Cancel any ongoing speech
    speechSynthesis?.cancel();

    // Reset state
    setTranscript('');
    setError('');
    setResponse('');

    // Set up to process when speech ends
    recognitionRef.current.shouldProcess = true;

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setError('Failed to start speech recognition. Please try again.');
      setStatus('error');
    }
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    // Save the current transcript before stopping
    recognitionRef.current.lastTranscript = transcript;
    recognitionRef.current.stop();
  }, [transcript]);

  // Handle mic button click
  const handleMicClick = useCallback(() => {
    if (status === 'listening') {
      stopListening();
    } else if (status === 'idle' || status === 'error') {
      startListening();
    }
  }, [status, startListening, stopListening]);

  // Get status text
  const getStatusText = () => {
    switch (status) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Thinking...';
      case 'speaking':
        return 'Speaking...';
      case 'error':
        return 'Error occurred';
      default:
        return 'Ready';
    }
  };

  // Render browser not supported message
  if (!isSupported) {
    return (
      <div className="voice-assistant">
        <div className="browser-warning">
          <h2>Browser Not Supported</h2>
          <p>
            Your browser does not support the Web Speech API.
            Please use Google Chrome, Microsoft Edge, or Safari for the best experience.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Orb Background - Main Focus */}
      <div className="orb-background">
        <Orb
          hue={status === 'listening' ? 120 : status === 'speaking' ? 200 : status === 'processing' ? 40 : 0}
          hoverIntensity={status === 'listening' || status === 'speaking' ? 0.8 : status === 'processing' ? 0.5 : 0.2}
          rotateOnHover={true}
          forceHoverState={status === 'listening' || status === 'processing' || status === 'speaking'}
          backgroundColor="#0f1419"
        />
      </div>

      {/* Minimal Header */}
      <header className="floating-header">
        <div className={`status-pill ${status}`}>
          <span className="status-dot" />
          <span>{getStatusText()}</span>
        </div>
      </header>

      {/* Bottom Control Bar */}
      <div className="bottom-bar">
        {/* Text Section - Left */}
        <div className="text-panel">
          {error && (
            <div className="error-toast">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <div className="conversation-bubble user-bubble">
            <span className="bubble-label">You</span>
            <p>{transcript || 'Tap mic and speak...'}</p>
          </div>

          <div className="conversation-bubble ai-bubble">
            <span className="bubble-label">AI</span>
            {status === 'processing' ? (
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            ) : (
              <p>{response || 'Waiting for your question...'}</p>
            )}
          </div>
        </div>

        {/* Mic Button - Right */}
        <div className="mic-section">
          <button
            className={`mic-fab ${status === 'listening' ? 'listening' : ''} ${status === 'processing' || status === 'speaking' ? 'disabled' : ''}`}
            onClick={handleMicClick}
            disabled={status === 'processing' || status === 'speaking'}
            aria-label={status === 'listening' ? 'Stop listening' : 'Start listening'}
          >
            <MicrophoneIcon className="mic-icon" />
            {status === 'listening' && <div className="mic-ripple" />}
            {status === 'listening' && <div className="mic-ripple delay" />}
          </button>
        </div>
      </div>
    </>
  );
}

// Microphone Icon Component
function MicrophoneIcon({ className }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
  );
}

export default App;
