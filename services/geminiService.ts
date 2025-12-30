
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { GroundingMetadata } from "../types";
import { sendMetric, sendEvent } from "./datadogService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION_ADVISOR = `You are VANGUARD, an expert survivalist and preparedness consultant. 
You provide concise, practical, and **ACTIONABLE** life-saving advice based on established survival protocols (FEMA, Red Cross, Wilderness Survival).

**OPERATIONAL DIRECTIVES:**
1. **BE ACTION-ORIENTED:** Do not just describe a risk; tell the user exactly what to do.
2. **PRIORITIZE SAFETY:** If a medical question is asked, provide immediate triage steps but mandate professional help.
3. **TONE:** Calm, authoritative, direct, and encouraging. Use military/tactical brevity.

**MANDATORY REASONING PROTOCOL:**
Every response MUST start with a hidden reasoning block using this exact format:
[TACTICAL_ASSESSMENT]
...concise reasoning about the user's situation, risks identified, and why you are recommending this specific course of action...
[END_ASSESSMENT]

Followed by your actual response to the user.
`;

const SYSTEM_INSTRUCTION_SIMULATOR = `You are the Dungeon Master for a serious survival simulation game called "WARGAMES". 
The user is a survivor in a crisis.
1. Start by describing a high-stakes scenario (e.g., Urban Blackout, Pandemic, Wilderness Crash) based on user selection or random if not specified.
2. Present the situation briefly (2-3 sentences).
3. Ask the user "What do you do?".
4. Evaluate their response for realism and survival logic.
5. Describe the outcome and the next challenge.
6. Track their "Health" and "Morale" implicitly. If they make a fatal error, the simulation ends.
Tone: Gritty, realistic, urgent. text-adventure style.`;

export const createAdvisorChat = (): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_ADVISOR,
    },
  });
};

export const createSimulationChat = (scenario: string): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_SIMULATOR + `\n\nStarting Scenario: ${scenario}`,
    },
  });
};

export const searchPlaces = async (query: string, userLocation?: { lat: number; lng: number }) => {
  const startTime = performance.now();
  try {
    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (userLocation) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: userLocation.lat,
            longitude: userLocation.lng,
          },
        },
      };
    }

    // Wrap the user query in a specific survival context to improve relevance and actionability
    const tacticalPrompt = `
      CONTEXT: You are VANGUARD, a tactical survival AI assisting a user in the field.
      USER QUERY: "${query}"
      
      MISSION OBJECTIVES:
      1. SEARCH REFINEMENT: Use the Google Maps tool to find real-world locations. 
         - If the user searches for generic resources (e.g., "water"), prioritize PHYSICAL SOURCES like "natural springs", "public water fountains", "campgrounds", or "reservoirs".
      
      2. REPORTING FORMAT:
         - Provide **ACTIONABLE ADVICE** regarding the locations found. 
         - Example: "Water source identified. TACTICAL ADVICE: Filter and boil before consumption due to urban runoff risk."
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: tacticalPrompt,
      config: config,
    });

    // Metrics
    const duration = performance.now() - startTime;
    sendMetric('vanguard.gemini.response_time_ms', duration, ['type:grounding']);
    
    if (response.usageMetadata) {
         sendMetric('vanguard.gemini.tokens_used', response.usageMetadata.totalTokenCount || 0, ['type:grounding']);
    }

    return response;
  } catch (error) {
    console.error("Maps grounding error:", error);
    sendMetric('vanguard.gemini.errors', 1, ['type:grounding']);
    sendEvent('Gemini Error', 'Maps Grounding failed during Intel Search', 'error');
    throw error;
  }
};
