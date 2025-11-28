import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractDataServerSide } from '../lib/ai';
import { appendToSheet } from '../lib/sheets';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Validate Method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const events = req.body.events || [];

    // 2. Process Events
    // Note: We use Promise.all to handle multiple events concurrently if LINE sends a batch
    await Promise.all(events.map(async (event: any) => {
      if (event.type === 'message' && event.message.type === 'text') {
        const { text } = event.message;
        const { userId } = event.source;
        const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

        console.log(`Processing message from ${userId}: ${text.substring(0, 20)}...`);

        // A. AI Extraction (Real-time)
        const extractedItems = await extractDataServerSide(text);

        // B. Prepare Rows for Google Sheets
        // Structure: [Timestamp, UserID, RawMessage, Type, Value, Context]
        const sheetRows = [];

        if (extractedItems.length === 0) {
          // If nothing extracted, still log the raw message
          sheetRows.push([
            timestamp,
            userId,
            text,
            'No Data',
            '-',
            '-'
          ]);
        } else {
          // Add a row for each extracted item
          extractedItems.forEach(item => {
            sheetRows.push([
              timestamp,
              userId,
              text,
              item.type,
              item.value,
              item.context
            ]);
          });
        }

        // C. Save to Google Sheets
        await appendToSheet(sheetRows);
      }
    }));

    // 3. Respond OK to LINE
    return res.status(200).json({ status: 'ok' });

  } catch (error) {
    console.error('Webhook Critical Error:', error);
    // Return 200 to prevent LINE from retrying indefinitely on logic errors
    return res.status(200).json({ status: 'error', message: 'Internal Error' });
  }
}
