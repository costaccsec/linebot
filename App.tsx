import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  FileSpreadsheet, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  RefreshCw,
  Clock,
  Zap,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { extractDataFromText } from './services/geminiService';
import { ExtractedItem, ProcessingStatus } from './types';

// Simple interface for display
interface SheetRow {
  id: number;
  received_at: string;
  user_id: string;
  message_text: string;
  extracted_type: string;
  extracted_value: string;
  extracted_context: string;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'manual'>('dashboard');
  
  // Dashboard State
  const [recentRows, setRecentRows] = useState<SheetRow[]>([]);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{connected: boolean, message: string, sheetId?: string} | null>(null);
  
  // Manual State
  const [inputText, setInputText] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedItem[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);

  const checkConnection = async () => {
    try {
      const res = await fetch('/api/connection');
      const data = await res.json();
      setConnectionStatus(data);
    } catch (e) {
      setConnectionStatus({ connected: false, message: 'API Unavailable' });
    }
  };

  const fetchRecentData = async () => {
    setIsLoadingRows(true);
    try {
      const res = await fetch('/api/messages');
      if (res.ok) {
        const data = await res.json();
        setRecentRows(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to fetch sheet data", error);
    } finally {
      setIsLoadingRows(false);
    }
  };

  useEffect(() => {
    checkConnection();
    if (activeTab === 'dashboard') {
      fetchRecentData();
      // Auto refresh every 30s
      const interval = setInterval(fetchRecentData, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleManualExtract = async () => {
    if (!inputText.trim()) return;
    setStatus(ProcessingStatus.PROCESSING);
    try {
      const result = await extractDataFromText(inputText);
      setExtractedData(result);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (error) {
      setStatus(ProcessingStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 p-2 rounded-lg text-white">
              <Zap size={24} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">LINE Auto Extractor</h1>
              <p className="text-xs text-gray-500">Real-time AI to Google Sheets</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             {connectionStatus ? (
                connectionStatus.connected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-green-600"></span>
                    Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <span className="w-2 h-2 rounded-full bg-red-600"></span>
                    Offline
                  </span>
                )
             ) : (
                <span className="text-xs text-gray-400">Checking...</span>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        
        {/* Connection Error Banner */}
        {connectionStatus && !connectionStatus.connected && (
           <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start justify-between">
             <div className="flex gap-3">
               <AlertTriangle className="text-red-500 mt-0.5" size={20} />
               <div>
                 <h3 className="font-bold text-red-700">Connection Error</h3>
                 <p className="text-sm text-red-600 mt-1">{connectionStatus.message}</p>
                 <p className="text-xs text-red-500 mt-2">
                   Please check your Vercel Environment Variables and ensure the Google Sheet is shared with the Service Account email.
                 </p>
               </div>
             </div>
             <button onClick={checkConnection} className="text-xs bg-red-200 text-red-800 px-3 py-1 rounded hover:bg-red-300">
               Re-check
             </button>
           </div>
        )}
        
        {/* Navigation Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'dashboard' 
                ? 'border-green-600 text-green-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileSpreadsheet size={18} />
            Live Dashboard (Google Sheets)
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'manual' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bot size={18} />
            ทดสอบระบบ (Manual Test)
          </button>
        </div>

        {activeTab === 'dashboard' ? (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
               <div>
                  <h2 className="text-lg font-semibold text-gray-900">Google Sheet Integration</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    ระบบจะบันทึกข้อความจาก LINE ลงใน Sheet นี้โดยอัตโนมัติ
                  </p>
               </div>
               <div className="flex gap-2">
                 <button 
                    onClick={checkConnection}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                 >
                   <RefreshCw size={16} />
                   Check Status
                 </button>
                 <a 
                   href={`https://docs.google.com/spreadsheets/d/${connectionStatus?.sheetId || ''}`}
                   target="_blank"
                   rel="noreferrer"
                   className={`flex items-center gap-2 px-5 py-2.5 text-white rounded-lg font-medium transition-shadow shadow-sm ${
                     connectionStatus?.sheetId 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-gray-300 cursor-not-allowed'
                   }`}
                 >
                   <FileSpreadsheet size={18} />
                   เปิดดู Google Sheet
                   <ExternalLink size={16} />
                 </a>
               </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                 <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                   <Clock size={18} />
                   รายการล่าสุด (Recent Activity)
                 </h3>
                 <button onClick={fetchRecentData} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                   <RefreshCw size={18} className={isLoadingRows ? "animate-spin" : ""} />
                 </button>
               </div>
               
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm whitespace-nowrap">
                   <thead className="bg-gray-50 text-gray-500">
                     <tr>
                       <th className="px-4 py-3 font-medium">เวลา</th>
                       <th className="px-4 py-3 font-medium">ประเภท</th>
                       <th className="px-4 py-3 font-medium">ค่า (Value)</th>
                       <th className="px-4 py-3 font-medium">ข้อความต้นฉบับ</th>
                       <th className="px-4 py-3 font-medium">ผู้ส่ง (ID)</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {recentRows.length === 0 ? (
                       <tr>
                         <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                           {isLoadingRows ? "กำลังโหลดข้อมูล..." : "ยังไม่พบข้อมูลล่าสุด หรือเชื่อมต่อ Google Sheet ไม่สำเร็จ"}
                         </td>
                       </tr>
                     ) : (
                       recentRows.map((row, idx) => (
                         <tr key={idx} className="hover:bg-gray-50">
                           <td className="px-4 py-3 text-gray-500">{row.received_at}</td>
                           <td className="px-4 py-3">
                             <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                               {row.extracted_type}
                             </span>
                           </td>
                           <td className="px-4 py-3 font-mono font-medium text-gray-900">{row.extracted_value}</td>
                           <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={row.message_text}>
                             {row.message_text}
                           </td>
                           <td className="px-4 py-3 text-gray-400 text-xs">{row.user_id.slice(0,8)}...</td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        ) : (
          /* Manual Test Mode */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="flex flex-col gap-4">
                <h3 className="font-semibold text-gray-700">ทดสอบ AI Extraction</h3>
                <textarea
                  className="w-full h-48 p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="พิมพ์ข้อความทดสอบที่นี่..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button
                  onClick={handleManualExtract}
                  disabled={status === ProcessingStatus.PROCESSING}
                  className="self-start px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  {status === ProcessingStatus.PROCESSING ? <Loader2 className="animate-spin" size={18}/> : <Bot size={18}/>}
                  ทดสอบสกัดข้อมูล
                </button>
             </div>

             <div className="bg-gray-100 rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-4">ผลลัพธ์ (Preview)</h3>
                {extractedData.length > 0 ? (
                  <div className="bg-white rounded-lg border overflow-hidden">
                    {extractedData.map((item, i) => (
                      <div key={i} className="p-3 border-b last:border-0 flex justify-between items-center">
                        <div>
                          <span className="text-xs text-blue-600 font-bold block">{item.type}</span>
                          <span className="text-sm text-gray-800">{item.context}</span>
                        </div>
                        <div className="font-mono font-bold text-lg">{item.value}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-10">ผลลัพธ์จะแสดงที่นี่</div>
                )}
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;