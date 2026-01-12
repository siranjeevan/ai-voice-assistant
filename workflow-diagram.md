# AI Voice Assistant Workflow Diagram

## System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend (React + Vite)"
        A[User Interface] --> B[Orb Component]
        A --> C[Voice Controls]
        A --> D[Status Display]
        B --> E[WebGL Shaders]
        C --> F[Web Speech API]
    end
    
    subgraph "Backend (Express.js)"
        G[REST API Server] --> H[Gemini AI Integration]
        G --> I[CORS Middleware]
        H --> J[Google Generative AI]
    end
    
    F --> G
    G --> F
    
    style A fill:#e1f5fe
    style G fill:#f3e5f5
    style J fill:#fff3e0
```

## Detailed Workflow Process

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI
    participant O as Orb Component
    participant WSA as Web Speech API
    parameter API as Express Server
    participant AI as Gemini AI
    participant TTS as Text-to-Speech

    Note over U,TTS: Voice Assistant Interaction Flow
    
    U->>UI: Clicks microphone button
    UI->>O: Update state (listening=true, hue=120)
    UI->>WSA: Start speech recognition
    O->>O: Animate orb (green, pulsing)
    
    WSA->>UI: Capture audio & convert to text
    UI->>UI: Display transcript (interim results)
    
    WSA->>UI: Speech recognition ends
    UI->>O: Update state (processing=true, hue=40)
    O->>O: Animate orb (yellow, rotating)
    
    UI->>API: POST /chat {message: transcript}
    API->>AI: Send prompt + user message
    AI->>API: Return AI response
    API->>UI: JSON {reply: cleanedResponse}
    
    UI->>O: Update state (speaking=true, hue=200)
    O->>O: Animate orb (blue, intense)
    UI->>TTS: Convert response to speech
    TTS->>U: Play audio response
    
    TTS->>UI: Speech synthesis complete
    UI->>O: Update state (idle=true, hue=0)
    O->>O: Return to idle animation
```

## Component State Flow

```mermaid
stateDiagram-v2
    [*] --> Idle
    
    Idle --> Listening : User clicks mic
    Listening --> Processing : Speech detected
    Listening --> Error : Speech recognition fails
    Processing --> Speaking : AI response received
    Speaking --> Idle : Speech synthesis complete
    Error --> Idle : User clicks mic again
    
    state Idle {
        [*] --> OrbRed
        OrbRed : Hue: 0 (Red)
        OrbRed : Intensity: 0.2
        OrbRed : Status: "Ready"
    }
    
    state Listening {
        [*] --> OrbGreen
        OrbGreen : Hue: 120 (Green)
        OrbGreen : Intensity: 0.8
        OrbGreen : Status: "Listening..."
        OrbGreen : Animation: Pulsing ripples
    }
    
    state Processing {
        [*] --> OrbYellow
        OrbYellow : Hue: 40 (Yellow)
        OrbYellow : Intensity: 0.5
        OrbYellow : Status: "Thinking..."
        OrbYellow : Animation: Rotating
    }
    
    state Speaking {
        [*] --> OrbBlue
        OrbBlue : Hue: 200 (Blue)
        OrbBlue : Intensity: 0.8
        OrbBlue : Status: "Speaking..."
        OrbBlue : Animation: Intense glow
    }
    
    state Error {
        [*] --> OrbRed
        OrbRed : Hue: 0 (Red)
        OrbRed : Status: "Error occurred"
        OrbRed : Display: Error message
    }
```

## Data Flow Architecture

```mermaid
flowchart LR
    subgraph "Browser Environment"
        subgraph "React Components"
            A[App.jsx] --> B[Orb.jsx]
            A --> C[Voice Controls]
            A --> D[Status Display]
        end
        
        subgraph "Web APIs"
            E[SpeechRecognition] --> A
            A --> F[SpeechSynthesis]
            B --> G[WebGL Context]
        end
    end
    
    subgraph "Network Layer"
        A --> H[HTTP POST /chat]
        H --> I[JSON Response]
        I --> A
    end
    
    subgraph "Server Environment"
        subgraph "Express.js Server"
            H --> J[CORS Middleware]
            J --> K[JSON Parser]
            K --> L[Chat Endpoint]
        end
        
        subgraph "AI Processing"
            L --> M[Gemini API Client]
            M --> N[Google AI Service]
            N --> O[Response Cleaning]
            O --> I
        end
    end
    
    style A fill:#4fc3f7
    style B fill:#81c784
    style L fill:#ba68c8
    style N fill:#ffb74d
```

## Orb Animation System

```mermaid
graph TD
    subgraph "Orb Component (WebGL)"
        A[Orb.jsx] --> B[WebGL Renderer]
        B --> C[Vertex Shader]
        B --> D[Fragment Shader]
        
        subgraph "Shader Uniforms"
            E[iTime - Animation time]
            F[hue - Color hue value]
            G[hover - Mouse interaction]
            H[hoverIntensity - Effect strength]
            I[backgroundColor - Background color]
        end
        
        C --> J[Position Calculation]
        D --> K[Color & Lighting]
        
        subgraph "Visual Effects"
            L[Noise-based Movement]
            M[Dynamic Color Shifting]
            N[Lighting Simulation]
            O[Mouse Hover Effects]
            P[Rotation Animation]
        end
        
        K --> L
        K --> M
        K --> N
        K --> O
        K --> P
    end
    
    subgraph "State-driven Changes"
        Q[App State] --> F
        Q --> G
        Q --> H
        R[Mouse Events] --> G
        S[Animation Loop] --> E
    end
    
    style A fill:#e8f5e8
    style B fill:#fff3e0
    style Q fill:#f3e5f5
```

## Error Handling Flow

```mermaid
flowchart TD
    A[User Action] --> B{Browser Support?}
    B -->|No| C[Show Browser Warning]
    B -->|Yes| D[Initialize Speech Recognition]
    
    D --> E{Microphone Permission?}
    E -->|Denied| F[Show Permission Error]
    E -->|Granted| G[Start Listening]
    
    G --> H{Speech Detected?}
    H -->|No Speech| I[Show "No speech detected"]
    H -->|Audio Capture Error| J[Show "Check microphone"]
    H -->|Success| K[Process Speech]
    
    K --> L{Server Available?}
    L -->|No| M[Show "Server unavailable"]
    L -->|Yes| N[Send to AI]
    
    N --> O{AI Response OK?}
    O -->|Error| P[Show "AI error"]
    O -->|Success| Q[Speak Response]
    
    Q --> R{Speech Synthesis OK?}
    R -->|Error| S[Show text only]
    R -->|Success| T[Complete Interaction]
    
    style C fill:#ffcdd2
    style F fill:#ffcdd2
    style I fill:#fff3e0
    style J fill:#ffcdd2
    style M fill:#ffcdd2
    style P fill:#ffcdd2
    style S fill:#fff3e0
    style T fill:#c8e6c9
```

## Technology Stack Integration

```mermaid
mindmap
  root((AI Voice Assistant))
    Frontend
      React 19
        Hooks (useState, useRef, useEffect)
        Component Architecture
        Event Handling
      Vite Build System
        Hot Module Replacement
        ES Modules
        Rolldown Integration
      WebGL Graphics
        OGL Library
        Custom Shaders
        Real-time Animation
      Web APIs
        Speech Recognition
        Speech Synthesis
        Canvas/WebGL
    Backend
      Node.js Runtime
        ES Modules
        Environment Variables
      Express.js Framework
        REST API
        CORS Middleware
        JSON Parsing
      Google AI Integration
        Gemini 2.5 Flash
        Generative AI SDK
        Response Processing
    Development Tools
      ESLint Configuration
      Package Management
        npm/package-lock.json
        Dependency Management
      Environment Setup
        .env Configuration
        Development Scripts
```