import React, { useEffect, useState } from 'react';
import { dataService } from '../utils/dataService';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatCurrency } from '../utils/helpers';
import { exportToCSV } from '../utils/csvExport';
import { toast } from 'react-hot-toast';
import { 
  FiFileText, 
  FiTrendingUp, 
  FiUsers, 
  FiDollarSign, 
  FiDownload, 
  FiPlus, 
  FiClock, 
  FiDatabase,
  FiGrid
} from 'react-icons/fi';

const Reports = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [reportType, setReportType] = useState('Attendance');
  const [generating, setGenerating] = useState(false);
  const [reportLogs, setReportLogs] = useState([]);
  const [previewData, setPreviewData] = useState(null);

  const loadData = async () => {
    try {
      const [eventsRes, reportsRes] = await Promise.all([
        dataService.getEvents(),
        dataService.getReports()
      ]);
      if (eventsRes.data) {
        const published = eventsRes.data.filter(e => e.status === 'Published');
        setEvents(published);
        if (published.length > 0) {
          setSelectedEventId(published[0].id);
        }
      }
      if (reportsRes.data) setReportLogs(reportsRes.data);
    } catch (e) {
      toast.error('Failed to load initial data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateReport = async () => {
    setGenerating(true);
    setPreviewData(null);
    try {
      const [regsRes, paymentsRes, eventsRes] = await Promise.all([
        dataService.getRegistrations(selectedEventId || null),
        dataService.getPayments(),
        dataService.getEvents()
      ]);

      const regs = regsRes.data || [];
      const payments = paymentsRes.data || [];
      const evs = eventsRes.data || [];
      
      const targetEvent = events.find(e => e.id === selectedEventId);
      const scopeName = targetEvent ? targetEvent.name : 'Global System';

      let generatedData = [];
      let headers = [];
      let filename = `Report_${reportType}_${scopeName.replace(/\s+/g, '_')}`;

      // 1. Generate specific report arrays
      if (reportType === 'Attendance') {
        headers = ['Attendee Name', 'Email', 'Event Name', 'Ticket Code', 'Check-In Status', 'Date Registered'];
        generatedData = regs.map(r => ({
          'Attendee Name': r.attendee?.full_name,
          'Email': r.attendee?.email,
          'Event Name': r.event?.name,
          'Ticket Code': r.ticket?.ticket_code || 'N/A',
          'Check-In Status': r.status,
          'Date Registered': formatDate(r.registration_date)
        }));
      } 
      
      else if (reportType === 'Revenue') {
        headers = ['Transaction ID', 'Date', 'Attendee', 'Event', 'Method', 'Gross', 'Refunded', 'Status'];
        const matchedPayments = selectedEventId 
          ? payments.filter(p => p.registration?.event_id === selectedEventId)
          : payments;

        generatedData = matchedPayments.map(p => ({
          'Transaction ID': p.transaction_id || 'N/A',
          'Date': formatDate(p.created_at),
          'Attendee': p.registration?.attendee?.full_name,
          'Event': p.registration?.event?.name,
          'Method': p.payment_method,
          'Gross': p.amount,
          'Refunded': p.refunded_amount,
          'Status': p.payment_status
        }));
      } 
      
      else if (reportType === 'Performance') {
        headers = ['Event Name', 'Code', 'Capacity', 'Registrations Count', 'Check-In Count', 'Attendance Rate', 'Gross Revenue'];
        const targetEvents = selectedEventId ? evs.filter(e => e.id === selectedEventId) : evs;

        generatedData = targetEvents.map(e => {
          const evRegs = regs.filter(r => r.event_id === e.id);
          const checked = evRegs.filter(r => r.status === 'Checked-in').length;
          const evPays = payments.filter(p => p.registration?.event_id === e.id && p.payment_status === 'Paid');
          const rev = evPays.reduce((s, p) => s + parseFloat(p.amount), 0);

          return {
            'Event Name': e.name,
            'Code': e.code,
            'Capacity': e.capacity,
            'Registrations Count': evRegs.length,
            'Check-In Count': checked,
            'Attendance Rate': evRegs.length ? `${Math.round((checked / evRegs.length) * 100)}%` : '0%',
            'Gross Revenue': rev
          };
        });
      } 
      
      else if (reportType === 'Registration') {
        headers = ['Attendee Name', 'Email', 'Event Name', 'Ticket Tier', 'Date Registered'];
        generatedData = regs.map(r => ({
          'Attendee Name': r.attendee?.full_name,
          'Email': r.attendee?.email,
          'Event Name': r.event?.name,
          'Ticket Tier': r.ticket_type,
          'Date Registered': formatDate(r.registration_date)
        }));
      }

      if (generatedData.length === 0) {
        toast.error('No record found matching selection parameters');
        setGenerating(false);
        return;
      }

      // 2. Set Preview
      setPreviewData({ headers, rows: generatedData.slice(0, 5), fullData: generatedData, filename });

      // 3. Write report to logs table
      await dataService.createReport({
        name: `${reportType} Summary (${scopeName})`,
        type: reportType,
        parameters: { event_id: selectedEventId || 'all' }
      }, user?.id);

      toast.success('Report processed! Preview loaded.');
      loadData(); // Reload logs
    } catch (e) {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const triggerExport = () => {
    if (!previewData) return;
    exportToCSV(previewData.fullData, previewData.headers, previewData.filename);
    toast.success('CSV Download triggered!');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white m-0 font-display">
          Analytics & Reports
        </h1>
        <p className="text-gray-550 dark:text-gray-400 text-sm mt-1">
          Compile aggregates, preview table metrics, and export data sheets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form Settings */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex flex-col space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white font-display border-b border-gray-100 dark:border-gray-850 pb-2">
            Configure Report Sheet
          </h3>

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="block w-full px-3 py-2.5 bg-gray-55/40 dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-205 dark:border-gray-850 rounded-xl text-sm"
            >
              <option value="Attendance">Attendance Roster</option>
              <option value="Revenue">Financial Billing Ledger</option>
              <option value="Performance">Event Capacity Performance</option>
              <option value="Registration">Signups & Ticket Tiers</option>
            </select>
          </div>

          {/* Event Filter Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Select Event Target</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="block w-full px-3 py-2.5 bg-gray-55/40 dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-205 dark:border-gray-850 rounded-xl text-sm"
            >
              <option value="">All Events (Global Organization)</option>
              {events.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={generating}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all disabled:opacity-40"
          >
            <FiTrendingUp className="w-4 h-4" />
            <span>{generating ? 'Processing Data...' : 'Generate Preview'}</span>
          </button>
        </div>

        {/* Right Column: Preview & History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Preview Section */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-850 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white font-display">
                Report Preview (Top 5 rows)
              </h3>
              {previewData && (
                <button
                  onClick={triggerExport}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 font-bold text-xs rounded-lg transition-all"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  <span>Download Full CSV</span>
                </button>
              )}
            </div>

            {!previewData ? (
              <div className="py-20 text-center text-gray-400 border border-dashed border-gray-200 dark:border-gray-850 rounded-xl text-sm">
                No active preview loaded. Use the left configuration board to process queries.
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-100 dark:border-gray-850 rounded-xl">
                <table className="w-full text-xs text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-[10px] text-gray-700 bg-gray-55/5 dark:bg-gray-850 dark:text-gray-300 uppercase">
                    <tr>
                      {previewData.headers.map((h, i) => (
                        <th key={i} scope="col" className="px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {previewData.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-550/5 text-gray-800 dark:text-gray-200">
                        {previewData.headers.map((h, colIdx) => {
                          const val = row[h];
                          return (
                            <td key={colIdx} className="px-4 py-3">
                              {/* Simple styling helper for numeric values */}
                              {typeof val === 'number' && h.includes('Price') || h.includes('Gross') || h.includes('Revenue')
                                ? formatCurrency(val)
                                : String(val)
                              }
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* History / Logs Section */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-display border-b border-gray-100 dark:border-gray-850 pb-3">
              Generated Reports Audit Log
            </h3>

            <div className="space-y-3.5 max-h-56 overflow-y-auto">
              {reportLogs.length === 0 ? (
                <div className="text-center text-xs py-8 text-gray-400">
                  No reports logged in the audit ledger yet.
                </div>
              ) : (
                reportLogs.map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs border-b border-gray-550/5 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded-lg">
                        <FiFileText className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800 dark:text-white">{log.name}</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">Type: {log.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400 text-[10px]">
                      <FiClock className="w-3.5 h-3.5" />
                      <span>{new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Reports;
