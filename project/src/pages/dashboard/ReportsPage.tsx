import { useState, useEffect, useMemo } from 'react';
import { FileText, Download, Trash2, Plus, Calendar } from 'lucide-react';
import { FilterBar } from '@/components/ui/FilterBar';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import { useIncidentData } from '@/lib/useIncidentData';
import { fetchReports, createReport, deleteReport } from '@/lib/queries';
import {
  computeKPIs, computeCategoryDistribution, computeSeverityDistribution,
  computeTopLocations, generateInsights,
} from '@/lib/analytics';
import { computeRiskScore } from '@/lib/riskEngine';
import type { ReportRecord } from '@/lib/types';

const REPORT_TYPES = [
  { id: 'crime_summary', label: 'Crime Summary', desc: 'Overview of all crime data' },
  { id: 'location_analysis', label: 'Location Analysis', desc: 'Geographic breakdown' },
  { id: 'monthly_analysis', label: 'Monthly Analysis', desc: 'Time-based trends' },
  { id: 'hotspot_report', label: 'Hotspot Report', desc: 'Hotspot detection results' },
  { id: 'risk_report', label: 'Risk Intelligence Report', desc: 'Risk scores and contributors' },
];

export function ReportsPage() {
  const { profile } = useAuth();
  const { filteredIncidents, hotspots, loading, error } = useIncidentData();
  const { showToast } = useToast();
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const kpis = useMemo(() => computeKPIs(filteredIncidents, hotspots.length), [filteredIncidents, hotspots.length]);
  const cats = useMemo(() => computeCategoryDistribution(filteredIncidents), [filteredIncidents]);
  const sevs = useMemo(() => computeSeverityDistribution(filteredIncidents), [filteredIncidents]);
  const topLocs = useMemo(() => computeTopLocations(filteredIncidents, 10), [filteredIncidents]);
  const insights = useMemo(() => generateInsights(filteredIncidents), [filteredIncidents]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      setReportsLoading(true);
      try {
        const data = await fetchReports(profile.id);
        setReports(data);
      } catch (e) {
        console.error('Failed to load reports', e);
      } finally {
        setReportsLoading(false);
      }
    })();
  }, [profile]);

  const handleGenerate = async (type: typeof REPORT_TYPES[0]) => {
    if (!profile) return;
    setGenerating(true);
    try {
      const summary = {
        kpis,
        topCategories: cats.slice(0, 5),
        severityDistribution: sevs,
        topLocations: topLocs,
        insights: insights.map((i) => ({ title: i.title, text: i.text })),
        riskScore: computeRiskScore(filteredIncidents, hotspots.length, 'overall'),
        generatedAt: new Date().toISOString(),
      };
      const report = await createReport(
        profile.id,
        type.label,
        type.id,
        null,
        null,
        summary
      );
      setReports((prev) => [report, ...prev]);
      showToast('Report generated successfully', 'success');
    } catch (e) {
      showToast('Failed to generate report', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      showToast('Report deleted', 'success');
    } catch (e) {
      showToast('Failed to delete report', 'error');
    }
  };

  const exportReport = (report: ReportRecord, format: 'csv' | 'json') => {
    const summary = report.summary as Record<string, unknown>;
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title.replace(/\s/g, '_')}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const rows: string[][] = [];
      const k = summary.kpis as Record<string, number>;
      rows.push(['Metric', 'Value']);
      Object.entries(k).forEach(([key, val]) => rows.push([key, String(val)]));
      rows.push([]);
      rows.push(['Category', 'Count', 'Percentage']);
      (summary.topCategories as { name: string; count: number; percentage: number }[]).forEach((c) =>
        rows.push([c.name, String(c.count), c.percentage.toFixed(1)])
      );
      rows.push([]);
      rows.push(['Location', 'Count']);
      (summary.topLocations as { location: string; count: number }[]).forEach((l) =>
        rows.push([l.location, String(l.count)])
      );
      const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title.replace(/\s/g, '_')}_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    showToast(`Report exported as ${format.toUpperCase()}`, 'success');
  };

  const exportExcelReport = (report: ReportRecord) => {
    import('xlsx').then((XLSX) => {
      const summary = report.summary as Record<string, unknown>;
      const k = summary.kpis as Record<string, number>;
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(Object.entries(k).map(([key, val]) => ({ Metric: key, Value: val }))), 'KPIs');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary.topCategories as Record<string, unknown>[]), 'Categories');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary.topLocations as Record<string, unknown>[]), 'Locations');
      XLSX.writeFile(wb, `${report.title.replace(/\s/g, '_')}_${Date.now()}.xlsx`);
      showToast('Report exported as Excel', 'success');
    });
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <FilterBar />

      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">Reports</h2>
      </div>

      {/* Generate new report */}
      <div>
        <h3 className="text-sm font-semibold text-white uppercase mb-3">Generate New Report</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {REPORT_TYPES.map((type) => (
            <div key={type.id} className="glass-card p-4">
              <p className="text-sm font-semibold text-white">{type.label}</p>
              <p className="text-xs text-slate-500 mt-1 mb-3">{type.desc}</p>
              <button
                onClick={() => handleGenerate(type)}
                disabled={generating}
                className="btn-primary text-xs w-full flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" /> Generate
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Existing reports */}
      <div>
        <h3 className="text-sm font-semibold text-white uppercase mb-3">Generated Reports</h3>
        {reportsLoading ? (
          <LoadingSpinner />
        ) : reports.length === 0 ? (
          <EmptyState title="No reports yet" message="Generate a report to see it here" />
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <div key={report.id} className="glass-card p-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{report.title}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(report.created_at).toLocaleDateString()} • {report.report_type}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => exportReport(report, 'csv')} className="btn-secondary text-xs flex items-center gap-1">
                    <Download className="w-3 h-3" /> CSV
                  </button>
                  <button onClick={() => exportExcelReport(report)} className="btn-secondary text-xs flex items-center gap-1">
                    <Download className="w-3 h-3" /> Excel
                  </button>
                  <button onClick={() => exportReport(report, 'json')} className="btn-secondary text-xs">
                    JSON
                  </button>
                  <button onClick={() => handleDelete(report.id)} className="text-red-400 hover:text-red-300 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current data summary preview */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white uppercase mb-3">Current Data Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><p className="text-[10px] text-slate-500 uppercase">Total Incidents</p><p className="text-xl font-bold text-cyan-400">{kpis.totalIncidents.toLocaleString()}</p></div>
          <div><p className="text-[10px] text-slate-500 uppercase">High Severity</p><p className="text-xl font-bold text-red-400">{kpis.highSeverity.toLocaleString()}</p></div>
          <div><p className="text-[10px] text-slate-500 uppercase">Risk Index</p><p className="text-xl font-bold text-amber-400">{kpis.riskIndex} / 100</p></div>
          <div><p className="text-[10px] text-slate-500 uppercase">Active Hotspots</p><p className="text-xl font-bold text-white">{kpis.activeHotspots}</p></div>
        </div>
        <div className="mt-4 space-y-1">
          {insights.slice(0, 3).map((ins, i) => (
            <p key={i} className="text-xs text-slate-400"><span className="text-cyan-400 font-semibold">{ins.title}:</span> {ins.text}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
