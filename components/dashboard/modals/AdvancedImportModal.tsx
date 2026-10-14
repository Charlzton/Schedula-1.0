'use client';

import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  Download, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Layers, 
  Table, 
  RefreshCw, 
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useTimetable } from '@/context/TimetableContext';
import { parseUploadedFile, generateExcelTemplate, ParsedDataset } from '@/lib/importParser';
import { useAuth } from '@/context/AuthContext';
import { LoadingButtonContent } from '@/components/LoadingButtonContent';
import { stripLeadingTitle, cleanLecturerTitle } from '@/lib/lecturerUtils';

interface AdvancedImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdvancedImportModal({ isOpen, onClose }: AdvancedImportModalProps) {
  const { 
    courses, 
    facilities, 
    lecturers, 
    timeSlots,
    addCourse,
    updateCourse,
    addFacility,
    updateFacility,
    addLecturer,
    updateLecturer,
    addTimeSlot,
    updateTimeSlot,
    addActivity
  } = useTimetable();

  const { user } = useAuth();

  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'results'>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [datasets, setDatasets] = useState<ParsedDataset[]>([]);
  const [activeDatasetIndex, setActiveDatasetIndex] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Duplicate resolution strategy per dataset item: 'skip' | 'update' | 'create'
  const [duplicateStrategies, setDuplicateStrategies] = useState<Record<string, 'skip' | 'update' | 'create'>>({});

  // Import Results Summary
  const [importStats, setImportStats] = useState<{
    imported: number;
    updated: number;
    skipped: number;
    errors: number;
  }>({ imported: 0, updated: 0, skipped: 0, errors: 0 });

  const resetModalState = () => {
    setStep('upload');
    setFileName('');
    setDatasets([]);
    setActiveDatasetIndex(0);
    setIsProcessing(false);
    setErrorMsg(null);
    setDuplicateStrategies({});
    setImportStats({ imported: 0, updated: 0, skipped: 0, errors: 0 });
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // Allow selecting another file repeatedly without refresh

    setFileName(file.name);
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const parsed = await parseUploadedFile(file);
      
      // Run validation & duplicate detection
      const validatedDatasets = parsed.map(ds => {
        const validationErrors: { rowIndex: number; field: string; message: string }[] = [];
        const duplicates: { rowIndex: number; existingId: string; type: string }[] = [];

        ds.rows.forEach((row, idx) => {
          const mappedRow: Record<string, any> = {};
          Object.entries(ds.mapping).forEach(([col, field]) => {
            if (field !== 'skip') {
              mappedRow[field] = row[col];
            }
          });

          if (ds.detectedType === 'courses') {
            const code = mappedRow.courseCode || row['Course Code'] || row['code'] || row['Course'];
            const title = mappedRow.courseTitle || row['Course Title'] || row['title'] || row['Name'];
            
            if (!code) {
              validationErrors.push({ rowIndex: idx, field: 'courseCode', message: 'Course Code is required' });
            }
            if (!title) {
              validationErrors.push({ rowIndex: idx, field: 'courseTitle', message: 'Course Title is required' });
            }

            const existing = courses.find(c => c.courseCode?.toLowerCase() === String(code || '').toLowerCase());
            if (existing) {
              duplicates.push({ rowIndex: idx, existingId: existing.courseCode, type: 'course' });
            }
          } else if (ds.detectedType === 'lecturers') {
            const rawName = mappedRow.name || mappedRow.fullName || row['Lecturer Name'] || row['Name'];
            if (!rawName) {
              validationErrors.push({ rowIndex: idx, field: 'name', message: 'Lecturer Name is required' });
            }
            const cleanSearch = stripLeadingTitle(rawName).toLowerCase();
            const existing = lecturers.find(l => stripLeadingTitle(l.fullName || (l as any).name).toLowerCase() === cleanSearch);
            if (existing) {
              duplicates.push({ rowIndex: idx, existingId: existing.lecturerId, type: 'lecturer' });
            }
          } else if (ds.detectedType === 'facilities') {
            const hall = mappedRow.hallName || row['Hall Name'] || row['Hall'] || row['Room'];
            const cap = Number(mappedRow.capacity || row['Capacity'] || 0);
            if (!hall) {
              validationErrors.push({ rowIndex: idx, field: 'hallName', message: 'Facility Name is required' });
            }
            if (isNaN(cap) || cap <= 0) {
              validationErrors.push({ rowIndex: idx, field: 'capacity', message: 'Capacity must be a positive number' });
            }
            const existing = facilities.find(f => f.hallName?.toLowerCase() === String(hall || '').toLowerCase());
            if (existing) {
              duplicates.push({ rowIndex: idx, existingId: existing.hallId, type: 'facility' });
            }
          }
        });

        return {
          ...ds,
          validationErrors,
          duplicates
        };
      });

      setDatasets(validatedDatasets);
      setActiveDatasetIndex(0);
      setStep('mapping');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process file. Please verify format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMappingChange = (datasetIdx: number, column: string, schedulaField: string) => {
    const updated = [...datasets];
    updated[datasetIdx].mapping[column] = schedulaField;
    setDatasets(updated);
  };

  const handleExecuteImport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    datasets.forEach((ds, dsIdx) => {
      ds.rows.forEach((row, rowIndex) => {
        // check if this row has validation errors
        const hasError = ds.validationErrors.some(e => e.rowIndex === rowIndex);
        if (hasError) {
          errorCount++;
          return;
        }

        const mapped: Record<string, any> = {};
        Object.entries(ds.mapping).forEach(([col, field]) => {
          if (field !== 'skip') {
            mapped[field] = row[col];
          }
        });

        const duplicateInfo = ds.duplicates.find(d => d.rowIndex === rowIndex);
        const strategy = duplicateStrategies[`${dsIdx}-${rowIndex}`] || 'skip';

        if (duplicateInfo) {
          if (strategy === 'skip') {
            skippedCount++;
            return;
          }
          if (strategy === 'update') {
            if (duplicateInfo.type === 'course') {
              updateCourse(duplicateInfo.existingId, {
                courseTitle: mapped.courseTitle || duplicateInfo.existingId,
                totalCredits: Number(mapped.totalCredits || mapped.creditHours) || 3,
                level: Number(mapped.level) || 300,
                semester: mapped.semester === 'Semester 2' ? 'Semester 2' : 'Semester 1',
                assignedLecturerName: mapped.lecturerName || 'Assigned Lecturer',
                expectedEnrollment: Number(mapped.expectedEnrollment) || 50
              }, true);
              updatedCount++;
              return;
            } else if (duplicateInfo.type === 'lecturer') {
              updateLecturer(duplicateInfo.existingId, {
                fullName: mapped.fullName || mapped.name || 'Lecturer',
                department: mapped.department || 'Computer Science',
                email: mapped.email || ''
              }, true);
              updatedCount++;
              return;
            } else if (duplicateInfo.type === 'facility') {
              updateFacility(duplicateInfo.existingId, {
                hallName: mapped.hallName || 'Hall',
                capacity: Number(mapped.capacity) || 100,
                buildingLocation: mapped.buildingLocation || mapped.building || 'Main Building'
              }, true);
              updatedCount++;
              return;
            }
          }
        }

        // Create new record
        if (ds.detectedType === 'courses') {
          const code = mapped.courseCode || `CRS-${Math.floor(Math.random() * 9000 + 1000)}`;
          addCourse({
            courseCode: code,
            courseTitle: mapped.courseTitle || 'Imported Course',
            totalCredits: Number(mapped.totalCredits || mapped.creditHours) || 3,
            level: Number(mapped.level) || 300,
            semester: mapped.semester === 'Semester 2' ? 'Semester 2' : 'Semester 1',
            theoryHours: 2,
            practicalHours: 1,
            department: mapped.department || 'Department of Computer Science',
            assignedLecturerName: mapped.lecturerName ? stripLeadingTitle(mapped.lecturerName) : 'Assigned Lecturer',
            expectedEnrollment: Number(mapped.expectedEnrollment) || 50
          }, true);
          importedCount++;
        } else if (ds.detectedType === 'lecturers') {
          const id = mapped.id || mapped.lecturerId || `LEC-${Math.floor(Math.random() * 9000 + 1000)}`;
          const rawName = String(mapped.fullName || mapped.name || 'New Lecturer').trim();
          const cleanName = stripLeadingTitle(rawName);
          const cleanTitle = cleanLecturerTitle(mapped.title);
          addLecturer({
            lecturerId: id,
            fullName: cleanName || rawName,
            title: cleanTitle || '',
            department: mapped.department || 'Department of Computer Science',
            email: mapped.email || `${(cleanName || id).toLowerCase().replace(/[^a-z0-9]+/g, '.')}@ug.edu.gh`
          }, true);
          importedCount++;
        } else if (ds.detectedType === 'facilities') {
          const id = `FAC-${Math.floor(Math.random() * 9000 + 1000)}`;
          addFacility({
            hallId: id,
            hallName: mapped.hallName || 'New Facility',
            capacity: Number(mapped.capacity) || 100,
            venueType: 'Lecture Hall',
            buildingLocation: mapped.buildingLocation || mapped.building || 'Main Building',
            hasProjector: true,
            hasComputers: false,
            status: 'Active'
          }, true);
          importedCount++;
        } else if (ds.detectedType === 'timeslots') {
          addTimeSlot({
            slotId: `TS-${Math.floor(Math.random() * 9000 + 1000)}`,
            day: mapped.day || 'Monday',
            startTime: mapped.startTime || '07:30',
            endTime: mapped.endTime || '10:25',
            durationHours: 3,
            sessionType: 'Theory'
          }, true);
          importedCount++;
        }
      });
    });

    setImportStats({
      imported: importedCount,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errorCount
    });

    addActivity('Bulk Data Import', `Successfully imported ${fileName} (${importedCount} added, ${updatedCount} updated)`, 'import');
    setIsProcessing(false);
    setStep('results');
  }, 650);
};

  const currentDataset = datasets[activeDatasetIndex] || datasets[0];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-md animate-in fade-in-50 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== 'preview') handleClose();
      }}
    >
      <div 
        className="w-full max-w-4xl glass-modal rounded-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-200/60 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                Advanced Data Import Center
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Import academic courses, lecturers, lecture halls & time slots from Excel, CSV, or PDF
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs custom-scrollbar flex-1">
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white">Need a structured spreadsheet template?</h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Download our pre-formatted Excel template with sample sheets.</p>
                  </div>
                </div>
                <button
                  onClick={generateExcelTemplate}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>

              <label className="border-2 border-dashed border-zinc-300 dark:border-white/20 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-sm text-zinc-900 dark:text-white">Click or drag your academic dataset here</p>
                  <p className="text-xs text-zinc-400">Supports Excel (.xlsx, .xls), CSV, PDF timetable documents, and JSON</p>
                </div>
                {isProcessing && (
                  <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold mt-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing file structure & extracting records...</span>
                  </div>
                )}
              </label>
            </div>
          )}

          {step === 'mapping' && datasets.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Column Mapping & Dataset Detection</h4>
                  <p className="text-zinc-500 dark:text-zinc-400">Review detected datasets and ensure columns align with Schedula attributes.</p>
                </div>
                {datasets.length > 1 && (
                  <div className="flex gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
                    {datasets.map((ds, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveDatasetIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                          activeDatasetIndex === idx ? 'bg-white dark:bg-white/20 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-500'
                        }`}
                      >
                        {ds.sheetName} ({ds.detectedType})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-500" />
                    Dataset: {currentDataset.sheetName} ({currentDataset.rows.length} rows detected)
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase">
                    Target: {currentDataset.detectedType}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {currentDataset.columns.map((col) => (
                    <div key={col} className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-white/10">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[150px]" title={col}>
                        {col}
                      </span>
                      <select
                        value={currentDataset.mapping[col] || 'skip'}
                        onChange={(e) => handleMappingChange(activeDatasetIndex, col, e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-900 dark:text-white cursor-pointer"
                      >
                        <option value="skip">-- Skip Column --</option>
                        {currentDataset.detectedType === 'courses' && (
                          <>
                            <option value="courseCode">Course Code</option>
                            <option value="courseTitle">Course Title</option>
                            <option value="creditHours">Credit Hours</option>
                            <option value="level">Level</option>
                            <option value="semester">Semester</option>
                            <option value="lecturerName">Lecturer Name</option>
                            <option value="hallName">Lecture Hall</option>
                            <option value="expectedEnrollment">Student Count / Capacity</option>
                          </>
                        )}
                        {currentDataset.detectedType === 'lecturers' && (
                          <>
                            <option value="name">Lecturer Name</option>
                            <option value="title">Academic Title / Rank (Optional)</option>
                            <option value="department">Department</option>
                            <option value="email">Email</option>
                          </>
                        )}
                        {currentDataset.detectedType === 'facilities' && (
                          <>
                            <option value="hallName">Facility Name</option>
                            <option value="capacity">Capacity</option>
                            <option value="building">Building</option>
                          </>
                        )}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Import Preview & Validation</h4>
                  <p className="text-zinc-500 dark:text-zinc-400">Review extracted records, validation status, and potential duplicates.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                    {currentDataset.rows.length - currentDataset.validationErrors.length} Valid Records
                  </span>
                  {currentDataset.validationErrors.length > 0 && (
                    <span className="px-3 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold">
                      {currentDataset.validationErrors.length} Errors Found
                    </span>
                  )}
                  {currentDataset.duplicates.length > 0 && (
                    <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                      {currentDataset.duplicates.length} Duplicates
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/60 dark:border-white/10 overflow-hidden">
                <div className="overflow-x-auto max-h-80 custom-scrollbar">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-black/[0.03] dark:bg-white/[0.03] border-b border-zinc-200/60 dark:border-white/10 text-left">
                        <th className="p-3">#</th>
                        <th className="p-3">Status</th>
                        {Object.values(currentDataset.mapping).filter(f => f !== 'skip').slice(0, 5).map(f => (
                          <th key={f} className="p-3 capitalize">{f.replace(/([A-Z])/g, ' $1')}</th>
                        ))}
                        <th className="p-3">Duplicate Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/60 dark:divide-white/10">
                      {currentDataset.rows.slice(0, 25).map((row, idx) => {
                        const error = currentDataset.validationErrors.find(e => e.rowIndex === idx);
                        const dup = currentDataset.duplicates.find(d => d.rowIndex === idx);
                        const strategy = duplicateStrategies[`0-${idx}`] || 'skip';

                        return (
                          <tr key={idx} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01]">
                            <td className="p-3 text-zinc-400 font-mono">{idx + 1}</td>
                            <td className="p-3">
                              {error ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 font-bold" title={error.message}>
                                  <AlertCircle className="w-3 h-3" /> Invalid
                                </span>
                              ) : dup ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 font-bold" title="Existing record match found">
                                  <AlertCircle className="w-3 h-3" /> Duplicate
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">
                                  <Check className="w-3 h-3" /> Valid
                                </span>
                              )}
                            </td>
                            {Object.entries(currentDataset.mapping).filter(([_, f]) => f !== 'skip').slice(0, 5).map(([col, _]) => (
                              <td key={col} className="p-3 text-zinc-700 dark:text-zinc-300 truncate max-w-[150px]">
                                {String(row[col] || '')}
                              </td>
                            ))}
                            <td className="p-3">
                              {dup ? (
                                <select
                                  value={strategy}
                                  onChange={(e) => setDuplicateStrategies(prev => ({ ...prev, [`0-${idx}`]: e.target.value as 'skip' | 'update' | 'create' }))}
                                  className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] font-semibold cursor-pointer border border-zinc-200 dark:border-white/10"
                                >
                                  <option value="skip">Skip Record</option>
                                  <option value="update">Update Existing</option>
                                  <option value="create">Create Anyway</option>
                                </select>
                              ) : (
                                <span className="text-zinc-400 italic">-- New --</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 'results' && (
            <div className="py-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white">Import Completed Successfully</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">All validated records have been saved to the Schedula database and synchronized.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto pt-2">
                <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10">
                  <div className="text-xl font-bold text-emerald-600">{importStats.imported}</div>
                  <div className="text-[11px] text-zinc-500">Imported</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10">
                  <div className="text-xl font-bold text-blue-600">{importStats.updated}</div>
                  <div className="text-[11px] text-zinc-500">Updated</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10">
                  <div className="text-xl font-bold text-amber-600">{importStats.skipped}</div>
                  <div className="text-[11px] text-zinc-500">Skipped</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10">
                  <div className="text-xl font-bold text-rose-600">{importStats.errors}</div>
                  <div className="text-[11px] text-zinc-500">Errors</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200/60 dark:border-white/10 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-zinc-200/60 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer"
          >
            {step === 'results' ? 'Close & View Data' : 'Cancel'}
          </button>

          <div className="flex items-center gap-2">
            {step === 'mapping' && (
              <button
                type="button"
                onClick={() => setStep('preview')}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer inline-flex items-center gap-2 shadow-md"
              >
                <span>Continue to Preview</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 'preview' && (
              <>
                <button
                  type="button"
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-zinc-200/60 dark:bg-white/10 text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer inline-flex items-center justify-center gap-2 shadow-lg disabled:opacity-75 select-none"
                >
                  <LoadingButtonContent
                    loading={isProcessing}
                    loadingText="Importing"
                    defaultText="Confirm & Import Data"
                    icon={<Sparkles className="w-3.5 h-3.5" />}
                  />
                </button>
              </>
            )}

            {step === 'results' && (
              <>
                <button
                  type="button"
                  onClick={resetModalState}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-all cursor-pointer inline-flex items-center gap-1.5 border border-blue-500/20"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Import Another File</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer shadow-lg"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
