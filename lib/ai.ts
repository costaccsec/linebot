import { GoogleGenAI, Type, Schema } from "@google/genai";

// Separate instance for Server-side usage
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          value: { type: Type.STRING, description: "The extracted numerical value" },
          type: { type: Type.STRING, description: "Category (e.g., ยอดเงิน, Order ID)" },
          context: { type: Type.STRING, description: "Brief context text" },
        },
        required: ["value", "type", "context"]
      }
    }
  }
};

export interface ExtractedDataSimple {
  value: string;
  type: string;
  context: string;
}

export const extractDataServerSide = async (text: string): Promise<ExtractedDataSimple[]> => {
  try {
    const modelId = "gemini-2.5-flash"; 
    
    const prompt = `
      Extract key numbers/identifiers from this LINE message for SAP entry.
      Message: """${text}"""
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1,
      },
    });

    const jsonText = response.text;
    if (!jsonText) return [];

    const parsedData = JSON.parse(jsonText);
    return parsedData.items || [];

  } catch (error) {
    console.error("AI Server Extraction Error:", error);
    return [];
  }
};
