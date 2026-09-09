import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, Database, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import { bulkInsertIncidents, createNotification } from '@/lib/queries';
import { LoadingSpinner, ErrorState } from '@/components/ui/States';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Legend,
} from 'recharts';
import { RoleBadge } from '@/components/ui/Badges';

interface ParsedRow {
  incident_id?: string;
  date?: string;
  time?: string;
  crime_type?: string;
  category?: string;
  severity?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  status?: string;
}

interface ValidationResult {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  missingValues: number;
  invalidCoords: number;
  invalidSeverity: number;
  missingDates: number;
  missingCrimeTypes: number;
  validRows: ParsedRow[];
  errors: string[];
}

const REQUIRED_COLUMNS = ['incident_id', 'date', 'crime_type', 'severity', 'location', 'latitude', 'longitude'];
const VALID_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const VALID_STATUSES = ['Open', 'Under Investigation', 'Closed', 'Arrested'];

function validateData(rows: ParsedRow[]): ValidationResult {
  const seen = new Set<string>();
  let valid = 0, invalid = 0, duplicates = 0, missingValues = 0, invalidCoords = 0, invalidSeverity = 0, missingDates = 0, missingCrimeTypes = 0;
  const validRows: ParsedRow[] = [];
  const errors: string[] = [];

  rows.forEach((row, i) => {
    let rowValid = true;
    if (!row.incident_id) { missingValues++; errors.push(`Row ${i + 1}: Missing incident_id`); rowValid = false; }
    if (!row.date) { missingDates++; rowValid = false; }
    if (!row.crime_type) { missingCrimeTypes++; rowValid = false; }
    if (!row.severity) { missingValues++; rowValid = false; }
    else if (!VALID_SEVERITIES.includes(row.severity)) { invalidSeverity++; rowValid = false; }
    if (!row.location) { missingValues++; rowValid = false; }
    if (row.latitude && row.longitude) {
      const lat = parseFloat(row.latitude);
      const lng = parseFloat(row.longitude);
      if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) { invalidCoords++; rowValid = false; }
    } else { missingValues++; rowValid = false; }
    if (row.incident_id && seen.has(row.incident_id)) { duplicates++; rowValid = false; }
    else if (row.incident_id) seen.add(row.incident_id);
    if (rowValid) { valid++; validRows.push(row); }
    else invalid++;
  });

  return { total: rows.length, valid, invalid, duplicates, missingValues, invalidCoords, invalidSeverity, missingDates, missingCrimeTypes, validRows, errors };
}

export function DataManagementPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState<number | null>(null);

  const isAdminOrAnalyst = profile?.role === 'ADMIN' || profile?.role === 'ANALYST';

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setValidation(null);
    setImported(null);
    setParsing(true);

    const isCSV = f.name.endsWith('.csv');
    const isExcel = f.name.endsWith('.xlsx') || f.name.endsWith('.xls');

    if (isCSV) {
      import('papaparse').then((Papa) => {
        Papa.parse(f, {
          header: true,
          complete: (results: { data: ParsedRow[] }) => {
            const val = validateData(results.data);
            setValidation(val);
            setParsing(false);
          },
          error: () => {
            showToast('Failed to parse CSV', 'error');
            setParsing(false);
          },
        });
      });
    } else if (isExcel) {
      import('xlsx').then((XLSX) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(ws) as ParsedRow[];
          const val = validateData(json);
          setValidation(val);
          setParsing(false);
        };
        reader.readAsArrayBuffer(f);
      });
    } else {
      showToast('Please upload a CSV or Excel file', 'error');
      setParsing(false);
    }
  }, [showToast]);

  const handleImport = async () => {
    if (!validation || !profile) return;
    setImporting(true);
    try {
      const rows = validation.validRows.map((r) => ({
        incident_id: r.incident_id || `IMP-${Date.now()}-${Math.random()}`,
        date: r.date || new Date().toISOString().substring(0, 10),
        time: r.time || null,
        crime_type: r.crime_type || 'Other',
        category: r.category || r.crime_type || 'Other',
        severity: r.severity as 'Low' | 'Medium' | 'High' | 'Critical',
        location: r.location || 'Unknown',
        latitude: parseFloat(r.latitude || '0'),
        longitude: parseFloat(r.longitude || '0'),
        status: (r.status && VALID_STATUSES.includes(r.status) ? r.status : 'Open') as 'Open' | 'Under Investigation' | 'Closed' | 'Arrested',
        is_synthetic: false,
      }));
      const result = await bulkInsertIncidents(rows);
      if (result.error) {
        showToast(`Import failed: ${result.error}`, 'error');
      } else {
        setImported(result.inserted);
        showToast(`${result.inserted} records imported successfully`, 'success');
        await createNotification(profile.id, 'Dataset Import', `${result.inserted} records successfully imported from ${file?.name}`, 'success');
      }
    } catch (e) {
      showToast('Import failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  if (!isAdminOrAnalyst) {
    return <ErrorState message="You need ADMIN or ANALYST role to access Data Management" />;
  }

  const qualityData = validation ? [
    { name: 'Completeness', value: Math.round(((validation.total - validation.missingValues) / validation.total) * 100) },
    { name: 'Valid Rows', value: Math.round((validation.valid / validation.total) * 100) },
    { name: 'Unique Records', value: Math.round(((validation.total - validation.duplicates) / validation.total) * 100) },
    { name: 'Valid Coords', value: Math.round(((validation.total - validation.invalidCoords) / validation.total) * 100) },
  ] : [];

  const errorBreakdown = validation ? [
    { name: 'Missing Values', count: validation.missingValues },
    { name: 'Duplicates', count: validation.duplicates },
    { name: 'Invalid Coords', count: validation.invalidCoords },
    { name: 'Invalid Severity', count: validation.invalidSeverity },
    { name: 'Missing Dates', count: validation.missingDates },
    { name: 'Missing Crime Types', count: validation.missingCrimeTypes },
  ] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Data Management</h2>
        </div>
        {profile && <RoleBadge role={profile.role} />}
      </div>

      {/* Upload area */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-white uppercase mb-3">Upload Dataset</h3>
        <div
          className="border-2 border-dashed border-cyan-500/20 rounded-xl p-8 text-center hover:border-cyan-500/40 transition-colors cursor-pointer"
          onClick={() => document.getElementById('file-upload')?.click()}
          onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => e.preventDefault()}
        >
          <Upload className="w-12 h-12 text-cyan-400/50 mx-auto mb-3" />
          <p className="text-sm text-slate-300">Drop CSV or Excel file here, or click to browse</p>
          <p className="text-xs text-slate-500 mt-1">Supports .csv, .xlsx, .xls</p>
          <input
            id="file-upload"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
        {file && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-white">{file.name}</span>
            <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
          </div>
        )}
        <div className="mt-3 text-xs text-slate-500">
          <p className="mb-1">Required columns: {REQUIRED_COLUMNS.join(', ')}</p>
          <p>Valid severity values: {VALID_SEVERITIES.join(', ')}</p>
        </div>
      </div>

      {parsing && <LoadingSpinner size="lg" />}

      {/* Validation results */}
      {validation && (
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white uppercase mb-4">Validation Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{validation.total}</p>
                <p className="text-xs text-slate-500 uppercase">Total Rows</p>
              </div>
              <div className="text-center">
                <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-400">{validation.valid}</p>
                <p className="text-xs text-slate-500 uppercase">Valid</p>
              </div>
              <div className="text-center">
                <XCircle className="w-6 h-6 text-red-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-400">{validation.invalid}</p>
                <p className="text-xs text-slate-500 uppercase">Invalid</p>
              </div>
              <div className="text-center">
                <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-amber-400">{validation.duplicates}</p>
                <p className="text-xs text-slate-500 uppercase">Duplicates</p>
              </div>
              <div className="text-center">
                <AlertTriangle className="w-6 h-6 text-orange-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-orange-400">{validation.missingValues}</p>
                <p className="text-xs text-slate-500 uppercase">Missing</p>
              </div>
            </div>
          </div>

          {/* Data Quality Charts */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white uppercase mb-3">Data Quality Indicators</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadialBarChart data={qualityData} innerRadius="20%" outerRadius="100%">
                  <RadialBar dataKey="value" cornerRadius={6} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white uppercase mb-3">Error Breakdown</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={errorBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Preview */}
          {validation.validRows.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white uppercase mb-3">Preview (First 5 Valid Rows)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      {REQUIRED_COLUMNS.map((c) => <th key={c} className="px-3 py-2 text-left text-slate-400 uppercase">{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {validation.validRows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-cyan-500/5">
                        <td className="px-3 py-2 text-slate-300">{row.incident_id}</td>
                        <td className="px-3 py-2 text-slate-300">{row.date}</td>
                        <td className="px-3 py-2 text-slate-300">{row.crime_type}</td>
                        <td className="px-3 py-2 text-slate-300">{row.severity}</td>
                        <td className="px-3 py-2 text-slate-300">{row.location}</td>
                        <td className="px-3 py-2 text-slate-300">{row.latitude}</td>
                        <td className="px-3 py-2 text-slate-300">{row.longitude}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import button */}
          {validation.valid > 0 && imported === null && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="btn-primary flex items-center gap-2"
            >
              {importing ? <><RefreshCw className="w-4 h-4 animate-spin" /> Importing...</> : <>Import {validation.valid} Valid Rows</>}
            </button>
          )}

          {imported !== null && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm text-green-400">{imported} records successfully imported to the database</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
