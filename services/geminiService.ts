import { GoogleGenAI, Type } from "@google/genai";
import type { GeminiResponse, ExtractedData, Workflow, PiiArea } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    documentType: {
      type: Type.STRING,
      description: "Categorize the primary document (e.g., 'Emirates ID', 'Traffic Fine', 'Visa Permit'). If multiple, use a composite type (e.g., 'Visa and Passport')."
    },
    extractedData: {
      type: Type.ARRAY,
      description: "An array of key-value pairs. Prioritize extracting expiry dates if available.",
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: "The translated label, e.g., 'Full Name', 'Expiry Date'." },
          value: { type: Type.STRING, description: "The extracted value, e.g., 'John Doe', '2025-12-31'." },
          verified: { type: Type.BOOLEAN, description: "Simulated verification status. Randomly set to true or false." }
        },
        required: ["label", "value", "verified"]
      }
    },
    workflow: {
      type: Type.OBJECT,
      description: "A step-by-step guide for a relevant government process based on the primary document.",
      properties: {
        title: { type: Type.STRING, description: "The translated title of the workflow." },
        steps: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              title: { type: Type.STRING, description: "Translated step title." },
              description: { type: Type.STRING, description: "Translated step description." }
            },
            required: ["id", "title", "description"]
          }
        }
      },
      required: ["title", "steps"]
    },
    crossValidationNotes: {
        type: Type.ARRAY,
        description: "Notes on data consistency if multiple documents are provided. Note any mismatches or confirmations. If only one document, return an empty array.",
        items: { type: Type.STRING }
    }
  },
  required: ["documentType", "extractedData", "workflow", "crossValidationNotes"]
};

export const extractAndGuide = async (files: { base64Data: string; mimeType: string }[], language: string): Promise<GeminiResponse> => {
  const prompt = `
    You are EmirEase, an expert AI assistant for Dubai government services.
    Analyze the attached document(s) and provide structured information in ${language}.

    Instructions:
    1.  First, accurately classify the primary document type.
    2.  Extract key information. CRITICAL: If you find an expiry date, you MUST extract it.
    3.  If multiple documents are provided, cross-validate key information (like names, numbers) and add notes about consistency or mismatches in 'crossValidationNotes'.
    4.  Generate a step-by-step workflow for a common process related to the primary document.
    5.  Simulate a verification check by randomly setting the 'verified' flag.
    6.  Translate all output (labels, titles, descriptions, notes) into ${language}.
    7.  Return ONLY the specified JSON format.
    `;
  
  const contentParts = [
    { text: prompt },
    ...files.map(file => ({
      inlineData: {
        mimeType: file.mimeType,
        data: file.base64Data,
      },
    }))
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: contentParts },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as GeminiResponse;
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    throw new Error(`Failed to get a valid response from the AI model. Details: ${error.message}`);
  }
};

export const translateData = async (data: { extractedData: ExtractedData[], workflow: Workflow, crossValidationNotes: string[] | null }, targetLanguage: string): Promise<GeminiResponse> => {
    const prompt = `
        Translate the JSON data object below into ${targetLanguage}.
        - Translate all 'label', 'value' (if not a proper noun or number), 'title', and 'description' fields.
        - Translate the strings in 'crossValidationNotes'.
        - Keep the original structure and keys.
        - Return ONLY the translated JSON object.

        JSON data:
        ${JSON.stringify(data, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        return {
            documentType: '', 
            extractedData: parsed.extractedData,
            workflow: parsed.workflow,
            crossValidationNotes: parsed.crossValidationNotes,
        };
    } catch (error) {
        console.error("Error calling Gemini API for translation:", error);
        throw new Error("Failed to translate the content.");
    }
};

export const getFaqAnswer = async (question: string, context: any, language: string): Promise<string> => {
  const prompt = `
    You are EmirEase, a helpful AI assistant for Dubai government services.
    A user has provided a document with the following details:
    ${JSON.stringify(context, null, 2)}

    The user is asking the following question in a chat: "${question}"

    Please provide a concise, helpful, and friendly answer.
    Base your answer on general knowledge of Dubai government services and the context provided.
    IMPORTANT: Detect the language of the user's question ("${question}") and respond in that language. If unsure, default to ${language}.
    `;
    
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for FAQ:", error);
    throw new Error("Failed to get a response from the AI model for your question.");
  }
};

export const analyzeTextFromPrompt = async(text: string, task: string, language: string): Promise<string> => {
    const prompt = `
      You are an expert analysis AI. A user has provided text and requested a specific task.
      Task: ${task}
      Language for response: ${language}
      
      User text:
      ---
      ${text}
      ---
      
      Please perform the task and provide a clear, well-formatted response in ${language}.
    `;
     try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
      } catch (error) {
        console.error("Error calling Gemini API for text analysis:", error);
        throw new Error("Failed to get a response from the AI model for your text.");
      }
};

export const findPiiForRedaction = async (file: { base64Data: string; mimeType: string }): Promise<PiiArea[]> => {
    const piiSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                x: { type: Type.NUMBER, description: "The top-left x-coordinate of the bounding box, as a percentage of image width." },
                y: { type: Type.NUMBER, description: "The top-left y-coordinate of the bounding box, as a percentage of image height." },
                width: { type: Type.NUMBER, description: "The width of the bounding box, as a percentage of image width." },
                height: { type: Type.NUMBER, description: "The height of the bounding box, as a percentage of image height." }
            },
            required: ["x", "y", "width", "height"]
        }
    };

    const prompt = `
    Analyze the attached image and identify all instances of personally identifiable information (PII), such as names, ID numbers, birth dates, addresses, and photos of faces.
    
    Return a JSON array of bounding box coordinates for each piece of PII found.
    Each coordinate (x, y, width, height) must be a number between 0 and 1, representing a percentage of the total image dimension.
    For example, x: 0.1 means 10% from the left edge.
    
    If no PII is found, return an empty array [].
    Return ONLY the JSON array.
    `;

    const contentParts = [
        { text: prompt },
        { inlineData: { mimeType: file.mimeType, data: file.base64Data } }
    ];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: contentParts },
            config: {
                responseMimeType: "application/json",
                responseSchema: piiSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as PiiArea[];
    } catch (error: any) {
        console.error("Error calling Gemini API for PII detection:", error);
        throw new Error(`Failed to detect PII. Details: ${error.message}`);
    }
}