import { google } from 'googleapis';

// ฟังก์ชันสำหรับเชื่อมต่อ Google Sheets
const getSheetsClient = () => {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    console.error('❌ Missing Google Service Account Credentials');
    throw new Error(
      'Credentials Missing: ไม่พบ GOOGLE_SERVICE_ACCOUNT_EMAIL หรือ GOOGLE_PRIVATE_KEY ใน Environment Variables'
    );
  }

  // Robust Key Parsing:
  // 1. Remove surrounding double quotes if present (e.g., "KEY")
  privateKey = privateKey.replace(/^"|"$/g, '');
  // 2. Replace literal "\n" characters with actual newlines (common issue in Vercel Env)
  privateKey = privateKey.replace(/\\n/g, '\n');

  try {
    const auth = new google.auth.JWT(
      clientEmail,
      undefined,
      privateKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );
    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('❌ Google Auth Error: Credential format might be invalid');
    throw error;
  }
};

export const appendToSheet = async (rows: string[][]) => {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID is missing.');
  }

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:F', // Assumes specific sheet name 'Sheet1'
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rows,
      },
    });
  } catch (error: any) {
    console.error('Append Sheet Error:', error.message);
    throw error;
  }
};

export const getRecentRows = async (limit: number = 20) => {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) return [];

  try {
    // Read a reasonable range, e.g., last 100 rows then slice
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A2:F100', // Skip header
    });
    
    const rows = response.data.values || [];
    // Return last 'limit' rows, reversed (newest first)
    return rows.reverse().slice(0, limit);
  } catch (error) {
    console.error('Get Rows Error:', error);
    return [];
  }
};

export const checkConnection = async () => {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID is missing in env');
  }

  // Try to fetch spreadsheet metadata (lightweight check)
  await sheets.spreadsheets.get({
    spreadsheetId,
  });

  return true;
};