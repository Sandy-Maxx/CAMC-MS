import React, { useState } from 'react';
import { Download, RefreshCw, HelpCircle, FileSpreadsheet, Upload, Clipboard, CheckCircle2, AlertTriangle } from 'lucide-react';
import { parseFullCSV, convertCSVRowsToContracts } from '../utils/csvParser';
import { Contract } from '../types';

interface SheetsSyncProps {
  onDataLoaded: (contracts: Contract[], sourceName: string) => void;
  currentSource: string;
  rowCount: number;
}

export default function SheetsSync({ onDataLoaded, currentSource, rowCount }: SheetsSyncProps) {
  const [sheetUrl, setSheetUrl] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetName, setSheetName] = useState('Sheet1');
  const [rawPaste, setRawPaste] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'link' | 'paste' | 'file'>('link');

  // Extracts Spreadsheet ID from standard Google Sheets URL
  const extractSpreadsheetId = (url: string): string | null => {
    const regExp = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const matches = url.match(regExp);
    return matches ? matches[1] : null;
  };

  const handleLinkFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const targetId = extractSpreadsheetId(sheetUrl) || spreadsheetId.trim();

    if (!targetId) {
      setErrorMsg('Please enter a valid Google Sheets URL or a valid Spreadsheet ID.');
      setIsLoading(false);
      return;
    }

    try {
      // Fetch public CSV representation from Google Sheets publishing endpoints
      // This is highly robust, works in browser, and bypasses any complex server setup
      const csvEndpoint = `https://docs.google.com/spreadsheets/d/${targetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
      const response = await fetch(csvEndpoint);
      
      if (!response.ok) {
        throw new Error('Google Sheets returned an error or is unreadable. Ensure link sharing is active.');
      }

      const csvText = await response.text();
      
      if (!csvText || csvText.length < 50) {
        throw new Error('No data retrieved or sheet is empty. Please verify the sheet name.');
      }

      const parsedRows = parseFullCSV(csvText);
      const convertedContracts = convertCSVRowsToContracts(parsedRows);

      if (convertedContracts.length === 0) {
        throw new Error('No valid contract rows could be parsed from this Google Sheet structure. Ensure column headers match.');
      }

      onDataLoaded(convertedContracts, `Google Sheet: ${sheetName}`);
      setSuccessMsg(`Successfully loaded ${convertedContracts.length} contract works live from Google Sheet!`);
      // Update metadata
      setSpreadsheetId(targetId);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Fetch failed: ${err.message || 'Ensure your spreadsheet is set to \"Anyone with the link can view\" under Share settings.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteParse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawPaste.trim()) {
      setErrorMsg('Paste buffer is empty.');
      return;
    }

    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      const parsedRows = parseFullCSV(rawPaste);
      const convertedContracts = convertCSVRowsToContracts(parsedRows);

      if (convertedContracts.length === 0) {
        throw new Error('No valid contract rows parsed. Check your CSV header columns.');
      }

      onDataLoaded(convertedContracts, 'Custom Pasted CSV Data');
      setSuccessMsg(`Successfully parsed ${convertedContracts.length} works from pasted CSV!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse clipboard CSV.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('File content is empty');

        const parsedRows = parseFullCSV(text);
        const convertedContracts = convertCSVRowsToContracts(parsedRows);

        if (convertedContracts.length === 0) {
          throw new Error('No valid contract records found in CSV file.');
        }

        onDataLoaded(convertedContracts, file.name);
        setSuccessMsg(`Successfully imported ${convertedContracts.length} contracts from ${file.name}!`);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to read uploaded CSV.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Error reading file.');
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <div id="sheets-sync-panel" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-10 border-dashed pb-4 mb-5">
        <div>
          <h2 className="text-xl font-bold font-sans tracking-tight text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Google Sheets & CSV Live Sync
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Current Data Source: <strong className="text-emerald-700 font-medium">{currentSource}</strong> ({rowCount} contracts)
          </p>
        </div>

        <div className="flex gap-1.5 p-1 bg-slate-50 rounded-xl mt-3 sm:mt-0 text-xs font-medium">
          <button
            onClick={() => setActiveTab('link')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'link' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Google Sheets Link
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'file' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Upload File
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'paste' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Paste Raw Text
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 bg-amber-50 border-l-4 border-amber-500 text-amber-800 p-3.5 rounded-r-xl text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Sync Alert</span>
            {errorMsg}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-3.5 rounded-r-xl text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Sync Successful</span>
            {successMsg}
          </div>
        </div>
      )}

      {activeTab === 'link' && (
        <div>
          <form onSubmit={handleLinkFetch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Google Sheets Sharing URL
                </label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/your-id-here/edit"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Sheet Name (e.g., Sheet1)
                </label>
                <input
                  type="text"
                  placeholder="Sheet1"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-3">
              <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-slate-600 text-xxs leading-relaxed">
                <p className="font-semibold text-slate-700 text-xs">How do I share my Google Sheet?</p>
                <ol className="list-decimal list-inside space-y-1 mt-1">
                  <li>In your Google Sheet, click the blue <strong className="text-slate-800">"Share"</strong> button on the top right.</li>
                  <li>Under General Access, change "Restricted" to <strong className="font-medium text-slate-800">"Anyone with the link"</strong> so that the app can construct the live API data feed.</li>
                  <li>Copy and paste that Google Sheet link into the input field above, and click Sync.</li>
                </ol>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-slate-900 border border-transparent shadow hover:bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {isLoading ? 'Syncing with Google Sheets API...' : 'Sync Live Sheet Now'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'file' && (
        <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 transition-colors p-8 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer relative bg-slate-50">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className="w-8 h-8 text-slate-400 mb-2" />
          <span className="font-medium text-xs text-slate-700 block">Click or Drag & Drop .CSV File</span>
          <span className="text-xxs text-slate-500 block mt-1">Import railway contract sheets parsed instantly to dashboard</span>
        </div>
      )}

      {activeTab === 'paste' && (
        <form onSubmit={handlePasteParse} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Paste comma-separated (CSV) lines:</span>
              <span className="text-xxs font-normal text-slate-400">Must include the standard header row</span>
            </label>
            <textarea
              placeholder="Section,Work Name,LOA Number & Date,Firm Name,Work Start Date,End date,Total Contract Value,Contract Qty,Contract Qty Unit,Qty Done till date,Qty Balance,Bill Done (Quantity),Financial Progress,Physical Progress,Work Status,Pending Bill status,Remarks,Superwisor,Remarks (Refined),Allocation Demand,Time Elapsed"
              rows={4}
              value={rawPaste}
              onChange={(e) => setRawPaste(e.target.value)}
              className="w-full text-xs font-mono rounded-xl border border-slate-200 p-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            type="submit"
            className="bg-emerald-600 shadow border border-transparent hover:bg-emerald-700 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Clipboard className="w-3.5 h-3.5" />
            Parse & Refresh Dashboard
          </button>
        </form>
      )}
    </div>
  );
}
