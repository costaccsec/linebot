export interface ExtractedItem {
  id: string;
  value: string; // The extracted number
  type: string; // e.g., "Order ID", "Amount", "Phone", "Tracking"
  context: string; // Brief text surrounding the number to verify
  confidence: number; // 0-1
}

export interface ExtractionResponse {
  items: ExtractedItem[];
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface LineMessage {
  id: number;
  line_msg_id: string;
  user_id: string;
  display_name?: string;
  message_text: string;
  received_at: string;
  status: 'pending' | 'processed';
}