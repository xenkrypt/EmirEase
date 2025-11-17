export interface Language {
  code: string;
  name: string;
}

export interface ExtractedData {
  label: string;
  value: string;
  verified: boolean;
}

export interface WorkflowStep {
  id: number;
  title: string;
  description: string;
}

export interface Workflow {
  title: string;
  steps: WorkflowStep[];
}

export interface GeminiResponse {
  documentType: string;
  extractedData: ExtractedData[];
  workflow: Workflow;
  crossValidationNotes?: string[];
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export interface User {
  username: string;
}

export interface PiiArea {
  x: number;
  y: number;
  width: number;
  height: number;
}