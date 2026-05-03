/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { FirstAidResponse, UrgencyLevel, EmergencyType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const SYSTEM_INSTRUCTION = `
You are GuardianAI, a critical emergency response system. 
Your goal is to provide immediate, clear, and actionable first-aid instructions based on the user's description.

DETECTION LOGIC:
- If the user describes "shaking uncontrollably," "fitting," or "convulsing," categorize as "Seizure".
- If user describes "difficulty breathing," "swelling," or "hives," categorize as "Allergic Reaction".
- If user describes "slurred speech" or "face drooping," categorize as "Stroke" (map to Other and note in situation).

RULES:
1. Detect Urgency:
   - HIGH: Life-threatening (Seizures, Cardiac Arrest, Heavy Bleeding, Choking, Severe Allergic Reaction).
   - MEDIUM: Needs first aid (Fractures, moderate burns).
   - LOW: Minor injury.

2. Mapping: Map the input to one of the following categories:
   - Cardiac Arrest, Bleeding, Burns, Choking, Fracture, Fire, Poisoning, Seizure, Allergic Reaction, Other.

3. Instructions:
   - Keep steps short (max 10-12 words per step).
   - Use simple, direct language.
   - Give 4-6 sequential steps.
   - Separate "DO"s and "DON'T"s clearly.
   - Provide a "voiceInstruction" (1-2 sentence summary).

4. SAFETY: 
   - ALWAYS advise calling emergency services (108) for HIGH and MEDIUM urgency.
   - Include a medical disclaimer.

Return the response in JSON format.
`;

const languageMap: Record<string, string> = {
  'en-US': 'English',
  'hi-IN': 'Hindi',
  'es-ES': 'Spanish',
  'ta-IN': 'Tamil',
  'kn-IN': 'Kannada',
  'te-IN': 'Telugu'
};

export async function analyzeEmergency(input: string, langCode: string = 'en-US'): Promise<FirstAidResponse> {
  const languageName = languageMap[langCode] || 'English';
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: input,
      config: {
        systemInstruction: `${SYSTEM_INSTRUCTION}\n\nIMPORTANT: You MUST provide all textual content (situation, steps, voiceInstruction, dos, donts) in the following language: ${languageName}. However, maintain the JSON structure and keys exactly as defined.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            urgency: {
              type: Type.STRING,
              enum: [UrgencyLevel.HIGH, UrgencyLevel.MEDIUM, UrgencyLevel.LOW],
              description: "The urgency level of the situation."
            },
            situation: {
              type: Type.STRING,
              description: "A brief summary of the detected situation."
            },
            emergencyType: {
              type: Type.STRING,
              enum: Object.values(EmergencyType),
              description: "The category of the emergency."
            },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Sequence of short instructions."
            },
            voiceInstruction: {
              type: Type.STRING,
              description: "Short summary for text-to-speech."
            },
            dos: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Positive actions to take."
            },
            donts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Actions to avoid."
            }
          },
          required: ["urgency", "situation", "emergencyType", "steps", "voiceInstruction", "dos", "donts"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(response.text.trim()) as FirstAidResponse;
  } catch (error) {
    console.error("Gemini analysis error:", error);
    // Fallback for safety - simple English fallback since JSON parsing might fail if we try to translate fallbacks here complexly
    return {
      urgency: UrgencyLevel.HIGH,
      situation: "Unknown Critical Emergency",
      emergencyType: EmergencyType.OTHER,
      steps: ["1. Call emergency services (108) immediately.", "2. Stay calm and assess the surroundings.", "3. Do not move the person unless necessary.", "4. Wait for professional help."],
      voiceInstruction: "I'm not exactly sure, but this sounds serious. Please call emergency services immediately.",
      dos: ["Call emergency services", "Stay with the person"],
      donts: ["Panic", "Perform advanced medical procedures if not trained"]
    };
  }
}

export async function getChatResponse(message: string, history: any[], langCode: string = 'en-US'): Promise<string> {
  const languageName = languageMap[langCode] || 'English';
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `You are the GuardianAI Rescue Assistant. You help users with follow-up questions during first-aid emergencies. Keep answers concise, medically accurate (based on general first aid), and supportive. Always prioritize calling emergency services if the situation sounds grave. IMPORTANT: You MUST respond in ${languageName}.`
      },
      history: history
    });

    const result = await chat.sendMessage({ message: message });
    return result.text || "I'm here to help. What else do you need to know?";
  } catch (error) {
    console.error("Chat error:", error);
    return "I'm having trouble connecting to the network. Please follow the instructions on screen and wait for emergency responders.";
  }
}
