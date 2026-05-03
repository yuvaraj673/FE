/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UrgencyLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum EmergencyType {
  CARDIAC_ARREST = 'Cardiac Arrest',
  BLEEDING = 'Bleeding',
  BURNS = 'Burns',
  CHOKING = 'Choking',
  FRACTURE = 'Fracture',
  FIRE = 'Fire',
  POISONING = 'Poisoning',
  SEIZURE = 'Seizure',
  ALLERGIC_REACTION = 'Allergic Reaction',
  OTHER = 'Other'
}

export interface FirstAidResponse {
  urgency: UrgencyLevel;
  situation: string;
  emergencyType: EmergencyType;
  steps: string[];
  voiceInstruction: string;
  dos: string[];
  donts: string[];
}

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Hospital {
  name: string;
  distance: string;
  address: string;
  rating?: number;
}
