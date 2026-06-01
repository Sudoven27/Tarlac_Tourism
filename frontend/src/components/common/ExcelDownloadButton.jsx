import React, { useState, useRef, useEffect } from 'react';
import { FiDownload, FiLoader, FiChevronDown, FiCheck, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const PERIODS = [
  { value: 'day', label: 'Today' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
  { value: 'custom', label: 'Custom Date' },
];

const TYPES = [
  { value: 'all', label: 'All (SAE + STA + STE + Summary)' },
  { value: 'sae', label: 'Accommodation (SAE)' },
  { value: 'sta', label: 'Tourist Attractions (STA)' },
  { value: 'ste', label: 'Tourism Enterprises (STE)' },
];

export default function ExcelDownloadButton({ municipality, year, type: defaultType, className = '' }) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState('year');
  const [type, setType] = useState(defaultType || 'all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [downloading, setDownloading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDownload = async () => {
    if (period === 'custom' && (!startDate || !endDate)) {
      toast.error('Please select both start and end dates for custom range');
      return;
    }
    setDownloading(true);
    const toastId = toast.loading('Preparing Excel report…');
    try {
      const params = new URLSearchParams({ period, type });
      if (municipality) params.append('municipality', municipality);
      if (year) params.append('year', year);
      if (period === 'custom' && startDate) params.append('startDate', startDate);
      if (period === 'custom' && endDate) params.append('endDate', endDate);

      const response = await api.get(`/excel/download?${params}`, { responseType: 'blob', timeout: 60000 });
      const url = URL.createObjectURL(new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `TarlacTourism_${type.toUpperCase()}_${period}_${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel report downloaded!', { id: toastId });
      setOpen(false);
    } catch (err) {
      const errText = err.response?.data;
      let msg = 'Download failed';
      if (errText instanceof Blob) {
        try {
          const text = await errText.text();
          const parsed = JSON.parse(text);
          msg = parsed.message || msg;
        } catch {}
      } else {
        msg = err.response?.data?.message || msg;
      }
      toast.error(msg, { id: toastId });
    } finally { setDownloading(false); }
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="btn-excel" disabled={downloading}>
        {downloading ? <FiLoader className="animate-spin" /> : <FiDownload />}
        Excel
        <FiChevronDown className={`transition-transform text-xs ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
          <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Export to Excel</p>
          </div>
          <div className="p-3 space-y-3">
            {/* Period */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Date Range</p>
              <div className="grid grid-cols-2 gap-1.5">
                {PERIODS.map(p => (
                  <button key={p.value} onClick={() => setPeriod(p.value)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                      period === p.value ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold' : 'border-gray-200 text-gray-600 hover:border-emerald-300'}`}>
                    {p.label} {period === p.value && <FiCheck className="text-emerald-500 text-xs" />}
                  </button>
                ))}
              </div>
              {period === 'custom' && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <FiCalendar className="text-gray-400 text-xs flex-shrink-0" />
                    <input type="date" className="form-input py-1 text-xs flex-1" value={startDate}
                      onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FiCalendar className="text-gray-400 text-xs flex-shrink-0" />
                    <input type="date" className="form-input py-1 text-xs flex-1" value={endDate}
                      onChange={e => setEndDate(e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            {/* Type */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Category</p>
              <div className="space-y-1">
                {TYPES.map(t => (
                  <button key={t.value} onClick={() => setType(t.value)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                      type === t.value ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold' : 'border-gray-200 text-gray-600 hover:border-emerald-300'}`}>
                    {t.label} {type === t.value && <FiCheck className="text-emerald-500 text-xs" />}
                  </button>
                ))}
              </div>
            </div>

            {municipality && <p className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">Filter: {municipality}</p>}

            <button onClick={handleDownload} disabled={downloading}
              className="btn-excel w-full justify-center py-2">
              {downloading ? <><FiLoader className="animate-spin" /> Generating…</> : <><FiDownload /> Download</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
