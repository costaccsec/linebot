import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExtractedItem } from "../types";

// Initialize Gemini Client
// Note: API Key must be set in Environment Variables in Vercel
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A unique identifier for this extraction (can be random)" },
          value: { type: Type.STRING, description: "The extracted numerical value (clean format, no commas if it's a number)" },
          type: { type: Type.STRING, description: "The category of the number (e.g., 'ยอดเงิน', 'Order ID', 'Tracking Number', 'เบอร์โทร', 'รหัสลูกค้า')" },
          context: { type: Type.STRING, description: "The original text or context identifying this number" },
          confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1" }
        },
        required: ["id", "value", "type", "context", "confidence"]
      }
    }
  }
};

export const extractDataFromText = async (text: string): Promise<ExtractedItem[]> => {
  try {
    const modelId = "gemini-2.5-flash"; // Using Flash for speed and cost-efficiency
    
    const prompt = `
      คุณคือผู้ช่วย AI ที่เชี่ยวชาญด้านการดึงข้อมูล (Data Extraction) สำหรับระบบ ERP/SAP
      
      งานของคุณคือ:
      1. วิเคราะห์ข้อความแชท หรือ text ที่ผู้ใช้ส่งมา ซึ่งอาจมีหลายรูปแบบปนกัน
      2. ดึงข้อมูล "ชุดตัวเลขที่สำคัญ" ออกมา โดยเฉพาะรูปแบบที่ไม่ซ้ำกัน
      3. ระบุประเภทของตัวเลขนั้นๆ ตามบริบท (เช่น ยอดโอน, เลขที่คำสั่งซื้อ, Tracking No., รหัสสมาชิก)
      4. จัดรูปแบบตัวเลขให้พร้อมสำหรับการนำไปคำนวณ (เช่น ตัดเครื่องหมายคอมม่าออก)
      5. ข้ามข้อมูลที่ไม่จำเป็น เช่น วันที่ หรือ เวลา (เว้นแต่จะดูเป็นรหัสสำคัญ)

      นี่คือข้อความที่ต้องวิเคราะห์:
      """
      ${text}
      """
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1, // Low temperature for consistent formatting
      },
    });

    const jsonText = response.text;
    if (!jsonText) return [];

    const parsedData = JSON.parse(jsonText);
    return parsedData.items || [];

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw new Error("ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
  }
};
