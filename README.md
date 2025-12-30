graph TB
    %% Zone 1: The Edge
    subgraph Edge ["Zone 1: The Tactical Edge (Raspberry Pi 2)"]
        direction TB
        HW[Raspberry Pi 2 ARMv7]
        Agent[Datadog IoT Agent v7]
        Monitor[Custom Python Monitor]
        
        HW -->|System Stats| Agent
        Monitor -->|Custom Metrics| Agent
        Agent -->|vanguard.pi.*| Cloud
    end

    %% Zone 2: Intelligence
    subgraph AI ["Zone 2: Intelligence (Google Cloud)"]
        direction TB
        G3P[Gemini 3 Pro]
        Thought[Thinking Mode Telemetry]
        Grounding[Environmental Grounding]
        
        Thought -.->|Latency/Reasoning Depth| DD
        G3P --- Grounding
    end

    %% Zone 3: External Data
    subgraph Data ["External Environmental Feeds"]
        API1[Seismic Activity API]
        API2[Flood Level API]
    end

    %% Zone 4: Observation
    subgraph DD ["Zone 3: Command Center (Datadog)"]
        direction TB
        Dash[Survival Dashboard]
        Monitors[Detection Rules]
        Incident[Actionable Incident Case]
        
        Monitors -->|Threshold Tripped| Incident
    end

    %% Flows
    Data -->|Context| Grounding
    Cloud(Telemetry Stream) --> Dash
    Edge -->|Heartbeat| Monitors
    AI -->|LLM Signals| Dash
    
    %% The User
    User((Crew Member))
    Dash -->|Actionable Intel| User
    User -->|Prompts| G3P

    %% Styling
    style Edge fill:#1a1a1a,stroke:#00ff00,color:#fff
    style AI fill:#1a1a1a,stroke:#4285F4,color:#fff
    style DD fill:#1a1a1a,stroke:#632CA6,color:#fff
    style User fill:#000,stroke:#fff,color:#fff

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/16M5xW3ZXcvqQQdhjQvJ4w-DI4jUDvUPM

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
