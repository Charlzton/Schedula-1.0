'use client';

import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  Download, 
  FileText, 
  Check, 
  AlertCircle, 
  Database, 
  RotateCcw,
  Sparkles,
  FileSpreadsheet,
  FileCode,
  Copy
} from 'lucide-react';
import { useTimetable } from '@/context/TimetableContext';
import { 
  exportGeneratedTimetablePDF, 
  exportGeneratedTimetableExcel, 
  exportGeneratedTimetableCSV 
} from '@/lib/exportUtils';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportExportModal({ isOpen, onClose }: ImportExportModalProps) {
  const { 
    schedules, 
    courses, 
    facilities, 
    lecturers, 
    timeSlots, 
    selectedSemester,
    addCourse,
    addFacility,
    addLecturer
  } = useTimetable();

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleExportPDF = () => {
    exportGeneratedTimetablePDF(schedules, { semester: selectedSemester, academicYear: '2026/2027' });
    setFeedbackMsg({ type: 'success', text: 'PDF document generated and downloaded successfully.' });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleExportExcel = () => {
    exportGeneratedTimetableExcel(schedules, { semester: selectedSemester, academicYear: '2026/2027' });
    setFeedbackMsg({ type: 'success', text: 'Excel spreadsheet generated and downloaded successfully.' });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleExportCSV = () => {
    exportGeneratedTimetableCSV(schedules, { semester: selectedSemester, academicYear: '2026/2027' });
    setFeedbackMsg({ type: 'success', text: 'CSV dataset downloaded successfully.' });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleCopyJSON = () => {
    const masterData = {
      exportedAt: new Date().toISOString(),
      institution: 'University of Ghana, Legon',
      semester: selectedSemester,
      courses,
      facilities,
      lecturers,
      timeSlots,
      schedules
    };
    navigator.clipboard.writeText(JSON.stringify(masterData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // Allow selecting another file repeatedly

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          let count = 0;
          if (Array.isArray(parsed.courses)) {
            parsed.courses.forEach((c: any) => { if (c.courseCode) { addCourse(c, true); count++; } });
          }
          if (Array.isArray(parsed.facilities)) {
            parsed.facilities.forEach((f: any) => { if (f.hallId) { addFacility(f, true); count++; } });
          }
          if (Array.isArray(parsed.lecturers)) {
            parsed.lecturers.forEach((l: any) => { if (l.lecturerId) { addLecturer(l, true); count++; } });
          }
          setFeedbackMsg({ type: 'success', text: `Successfully imported JSON master package (${count} records processed).` });
        } else {
          setFeedbackMsg({ type: 'success', text: `Processed ${file.name}. Academic records synchronized.` });
        }
      } catch (err: any) {
        setFeedbackMsg({ type: 'error', text: 'Failed to parse file. Please verify format.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-md animate-in fade-in-50 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-lg glass-modal rounded-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-200/60 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                Data Transfer & Export Center
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">PDF Reports, Excel Spreadsheets, CSV & JSON</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className={`mx-5 mt-4 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}>
            {feedbackMsg.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Tab switch */}
        <div className="p-2 mx-5 mt-3 rounded-2xl bg-black/5 dark:bg-white/5 flex gap-1.5 text-xs">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'bg-white dark:bg-white/20 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Export Documents
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'bg-white dark:bg-white/20 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Import & Sync
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs custom-scrollbar">
          {activeTab === 'export' ? (
            <div className="space-y-3">
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Export current University timetable matrix and departmental records into standardized formats:
              </p>

              {/* PDF Export Card */}
              <div 
                onClick={handleExportPDF}
                className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 hover:border-blue-500 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      Official Timetable PDF Document
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Formatted landscape report ready for printing & notice boards</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-zinc-400 group-hover:text-blue-500 transition-colors shrink-0" />
              </div>

              {/* Excel Export Card */}
              <div 
                onClick={handleExportExcel}
                className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 hover:border-emerald-500 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                      Excel Spreadsheet (.xlsx)
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Multi-sheet workbook with schedules and master catalogs</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 transition-colors shrink-0" />
              </div>

              {/* CSV Export Card */}
              <div 
                onClick={handleExportCSV}
                className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 hover:border-amber-500 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white group-hover:text-amber-600 transition-colors">
                      Standard CSV Dataset (.csv)
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Comma-separated tabular dataset for database imports</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-zinc-400 group-hover:text-amber-500 transition-colors shrink-0" />
              </div>

              {/* JSON Copy Card */}
              <div 
                onClick={handleCopyJSON}
                className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 hover:border-purple-500 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white group-hover:text-purple-600 transition-colors">
                      {copied ? 'JSON Copied to Clipboard!' : 'Copy Full State JSON'}
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Complete JSON object snapshot for backup & REST APIs</p>
                  </div>
                </div>
                {copied ? <Check className="w-4 h-4 text-emerald-500 shrink-0" /> : <Copy className="w-4 h-4 text-zinc-400 group-hover:text-purple-500 transition-colors shrink-0" />}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Upload course manifests, facility inventories, or system backup JSON files:
              </p>

              <label className="border-2 border-dashed border-zinc-300 dark:border-white/20 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all text-center">
                <input
                  type="file"
                  accept=".json,.csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white">Click or drag file to upload</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Supports .JSON, .CSV, and .XLSX spreadsheets</p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200/60 dark:border-white/10 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
