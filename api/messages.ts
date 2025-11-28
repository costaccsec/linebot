import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRecentRows } from '../lib/sheets';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rows = await getRecentRows(20);
    
    // Transform array to object for frontend
    // Row structure assumed: [Timestamp, UserID, RawMessage, Type, Value, Context]
    const messages = rows.map((row, index) => ({
      id: index,
      received_at: row[0],
      user_id: row[1],
      message_text: row[2],
      extracted_type: row[3],
      extracted_value: row[4],
      extracted_context: row[5]
    }));

    return res.status(200).json({ messages });
  } catch (error) {
    console.error('Fetch Sheets Error:', error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
}
