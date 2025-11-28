import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkConnection } from '../lib/sheets';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sheetId = process.env.GOOGLE_SHEET_ID;

  try {
    await checkConnection();
    return res.status(200).json({ 
      connected: true, 
      message: 'Google Sheets Connected Successfully',
      sheetId: sheetId 
    });
  } catch (error: any) {
    console.error('Connection Check Failed:', error.message);
    
    let userMessage = 'Connection Failed';
    if (error.message.includes('Missing')) userMessage = 'Missing Credentials';
    if (error.message.includes('403')) userMessage = 'Permission Denied (Check Share Settings)';
    if (error.message.includes('404')) userMessage = 'Spreadsheet Not Found (Check ID)';

    return res.status(200).json({ 
      connected: false, 
      message: userMessage,
      details: error.message,
      sheetId: sheetId // Send back even if failed, might help debugging
    });
  }
}