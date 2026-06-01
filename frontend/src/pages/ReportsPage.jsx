import React, { useState, useEffect, useCallback, useRef } from 'react';
import ExcelDownloadButton from '../components/common/ExcelDownloadButton';
import {
  FiPrinter, FiFilter, FiUsers, FiHome, FiMapPin, FiBriefcase,
  FiBarChart2, FiDownload, FiCamera
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../services/api';
import { MUNICIPALITIES, REPORT_YEARS, MUN_COLORS } from '../utils/constants';

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const RADIAN = Math.PI / 180;

const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  return (
    <text x={cx + r * Math.cos(-midAngle * RADIAN)} y={cy + r * Math.sin(-midAngle * RADIAN)}
      fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="600">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function ReportsPage() {
  const [filters, setFilters] = useState({ year: 2026, municipality: '' });
  const [stats, setStats] = useState(null);
  const [visitorStats, setVisitorStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [savingImg, setSavingImg] = useState(false);
  const reportRef = useRef(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year: filters.year });
      if (filters.municipality) params.append('municipality', filters.municipality);
      const [dashResp, visResp] = await Promise.all([
        api.get(`/dashboard/stats?${params}`),
        api.get(`/visitors/stats?${params}`)
      ]);
      setStats(dashResp.data.data);
      setVisitorStats(visResp.data.data);
    } catch { toast.error('Failed to load report data'); }
    finally { setLoading(false); }
  }, [filters.year, filters.municipality]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Print: snapshot charts first, then print ──────────────────────────────
  const handlePrint = async () => {
    setPrinting(true);
    try {
      // Snapshot all Recharts SVGs into inline <img> so they survive print
      const wrappers = document.querySelectorAll('#printable-report .recharts-wrapper');
      const snapshots = [];

      for (const wrapper of wrappers) {
        const svg = wrapper.querySelector('svg');
        if (!svg) continue;
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        snapshots.push({ wrapper, url });
        // Overlay a snapshot image during print
        const img = document.createElement('img');
        img.src = url;
        img.style.cssText = `width:${svg.clientWidth}px;height:${svg.clientHeight}px;display:block;`;
        img.className = 'print-chart-snapshot';
        wrapper.parentNode.insertBefore(img, wrapper.nextSibling);
      }

      // Wait a tick for images to load
      await new Promise(r => setTimeout(r, 400));
      window.print();

      // Cleanup snapshots after print dialog closes
      setTimeout(() => {
        document.querySelectorAll('.print-chart-snapshot').forEach(el => el.remove());
        snapshots.forEach(s => URL.revokeObjectURL(s.url));
      }, 1500);
    } catch (e) {
      toast.error('Print failed: ' + e.message);
    } finally {
      setPrinting(false);
    }
  };

  // ── Save report as PNG image ───────────────────────────────────────────────
  const handleSaveImage = async () => {
    if (!reportRef.current || savingImg) return;
    setSavingImg(true);
    const toastId = toast.loading('Capturing report…');
    try {
      const { default: h2c } = await import('html2canvas');
      // Wait for charts
      await new Promise(r => setTimeout(r, 500));
      const canvas = await h2c(reportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        width: reportRef.current.scrollWidth,
        height: reportRef.current.scrollHeight,
        onclone: (doc) => {
          // Force recharts wrappers visible
          doc.querySelectorAll('.recharts-wrapper').forEach(el => {
            el.style.overflow = 'visible';
            el.style.position = 'relative';
          });
          doc.querySelectorAll('.recharts-surface').forEach(el => {
            el.style.overflow = 'visible';
          });
        }
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `TarlacTourism_Report_${filters.year}.png`;
      a.click();
      toast.success('Report saved as image!', { id: toastId });
    } catch (e) {
      toast.error('Failed to save: ' + e.message, { id: toastId });
    } finally { setSavingImg(false); }
  };

  // ── Chart data ────────────────────────────────────────────────────────────
  const monthlyTrend = (stats?.visitorsByMonth || []).map(m => ({
    name: SHORT_MONTHS[m.month - 1],
    'This Mun.': m.thisMun || 0,
    'Province': m.thisProvince || 0,
    'Other Prov.': m.otherProvince || 0,
    'Foreign': m.foreign || 0,
    'Total': m.total || 0
  }));

  const inventoryMun = stats?.inventoryByMunicipality || MUNICIPALITIES.map(m => ({
    municipality: m, sae: 0, sta: 0, ste: 0, rooms: 0,
    visitors: 0, thisMun: 0, thisProvince: 0, otherProvince: 0, foreign: 0
  }));

  const saeTypePie = (stats?.byType?.sae || []).map(t => ({ name: t._id || 'Unknown', value: t.count }));
  const steTypePie = (stats?.byType?.ste || []).map(t => ({ name: t._id || 'Unknown', value: t.count }));

  const residencePie = [
    { name: 'This Municipality', value: stats?.totals?.thisMunVisitors || 0, color: '#059669' },
    { name: 'This Province',     value: stats?.totals?.thisProvinceVisitors || 0, color: '#0891b2' },
    { name: 'Other Province',    value: stats?.totals?.otherProvinceVisitors || 0, color: '#7c3aed' },
    { name: 'Foreign',           value: stats?.totals?.foreignVisitors || 0, color: '#d97706' },
  ].filter(d => d.value > 0);

  const filterLabel = [`Year ${filters.year}`, filters.municipality || 'All Municipalities'].join(' · ');
  const generatedDate = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      {/* ── Print & screen styles ───────────────────────────────────────────── */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm 8mm 10mm 8mm;
        }

        @media print {
          /* Hide the entire app shell */
          body { background: white !important; }
          body > * { display: none !important; }
          body > #root { display: block !important; }-
          #root > div { display: none !important; }

          /* Reveal only the printable report by hoisting it */
          #printable-report {
            display: block !important;
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important;
            background: white !important;
            z-index: 99999 !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Sidebar, nav, toolbar, filters: gone */
          aside, nav, header,
          .no-print,
          .report-toolbar,
          .report-filters-bar { display: none !important; }

          /* Colour printing */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Cards: flat, no shadow, no scroll */
          .card {
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 6px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: visible !important;
            background: white !important;
          }

          /* Recharts: must be visible */
          .recharts-wrapper,
          .recharts-surface,
          .recharts-legend-wrapper { overflow: visible !important; }

          /* Chart snapshot images rendered by handlePrint() */
          .print-chart-snapshot { display: block !important; page-break-inside: avoid; }

          /* Grid helpers */
          .print-2col { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 6px !important; }
          .print-4col { display: grid !important; grid-template-columns: 1fr 1fr 1fr 1fr !important; gap: 4px !important; }

          /* Tables */
          .data-table { width: 100% !important; font-size: 7pt !important; }
          .data-table th,
          .data-table td { padding: 3px 5px !important; font-size: 7pt !important; }

          /* Section spacing */
          .report-section { margin-bottom: 6px !important; page-break-inside: avoid; break-inside: avoid; }

          /* Typography scale-down */
          h1 { font-size: 14pt !important; }
          h2 { font-size: 11pt !important; }
          h3 { font-size: 9pt !important; }
          p, span, td, th { font-size: 8pt !important; }
        }
      `}</style>

      <div className="space-y-5">

        {/* ── Toolbar ── */}
        <div className="report-toolbar page-header no-print">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                <FiBarChart2 className="text-emerald-600 text-lg" />
              </div>
              <h1 className="page-title">Reports &amp; Analytics</h1>
            </div>
            <p className="page-subtitle ml-12">Province of Tarlac Tourism Inventory Summary Report</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <ExcelDownloadButton municipality={filters.municipality} year={filters.year} />
            <button onClick={handleSaveImage} disabled={savingImg}
              className="btn-outline text-sm py-2 px-3 flex items-center gap-1.5">
              {savingImg ? <div className="spinner w-4 h-4" /> : <FiCamera />}
              Save Image
            </button>
            <button onClick={handlePrint} disabled={printing}
              className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
              <FiPrinter /> {printing ? 'Preparing…' : 'Print / Save PDF'}
            </button>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="report-filters-bar card no-print">
          <div className="flex items-center gap-2 mb-3">
            <FiFilter className="text-emerald-600" />
            <span className="text-sm font-semibold text-gray-700">Report Filters</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="form-label text-xs">Report Year</label>
              <select className="form-select text-sm py-2" value={filters.year}
                onChange={e => setFilters(f => ({ ...f, year: Number(e.target.value) }))}>
                {REPORT_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label text-xs">Municipality</label>
              <select className="form-select text-sm py-2" value={filters.municipality}
                onChange={e => setFilters(f => ({ ...f, municipality: e.target.value }))}>
                <option value="">All Municipalities</option>
                {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            PRINTABLE REPORT — this exact div is captured / printed
        ══════════════════════════════════════════════════════════════ */}
        <div id="printable-report" ref={reportRef}
          style={{ background: 'white' }}>

          {/* Print-only header */}
          <div className="hidden print:block mb-4 pb-3 border-b-2 border-emerald-700">
            <h1 className="text-xl font-bold text-emerald-800">TARLAC TOURISM OFFICE</h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest">
              Heart of Wonders · Province of Tarlac, Region III
            </p>
            <h2 className="text-base font-semibold mt-1">
              INVENTORY SUPPLY DATA — SUMMARY REPORT
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Period: {filterLabel} · Generated: {generatedDate}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="spinner w-10 h-10 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Loading report data…</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">

              {/* ── Summary Stats ── */}
              <div className="report-section">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2 no-print">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                  Summary Statistics · {filterLabel}
                </h2>

                {/* Primary stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print-4col">
                  {[
                    { label: 'Accommodation',    value: stats?.totals?.sae || 0,      sub: `${stats?.totals?.rooms || 0} rooms`,               icon: FiHome,      c: 'emerald' },
                    { label: 'Tourist Attractions', value: stats?.totals?.sta || 0,   sub: 'STA records',                                       icon: FiMapPin,    c: 'emerald' },
                    { label: 'Tourism Enterprises', value: stats?.totals?.ste || 0,   sub: 'STE records',                                       icon: FiBriefcase, c: 'gold'    },
                    { label: 'Total Visitors',   value: stats?.totals?.visitors || 0, sub: `${stats?.totals?.foreignVisitors || 0} foreign`,    icon: FiUsers,     c: 'gold'    },
                  ].map(s => (
                    <div key={s.label} className="card text-center py-4">
                      <div className={`w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center
                        ${s.c === 'gold' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        <s.icon className="text-lg" />
                      </div>
                      <p className={`text-2xl font-bold font-display ${s.c === 'gold' ? 'text-amber-600' : 'text-emerald-700'}`}>
                        {s.value.toLocaleString()}
                      </p>
                      <p className="text-xs font-semibold text-gray-600 mt-0.5 leading-tight">{s.label}</p>
                      <p className="text-xs text-gray-400">{s.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Visitor breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 print-4col">
                  {[
                    { label: 'This Municipality', value: stats?.totals?.thisMunVisitors || 0 },
                    { label: 'This Province',     value: stats?.totals?.thisProvinceVisitors || 0 },
                    { label: 'Other Province',    value: stats?.totals?.otherProvinceVisitors || 0 },
                    { label: 'Foreign Visitors',  value: stats?.totals?.foreignVisitors || 0 },
                  ].map(s => (
                    <div key={s.label} className="card py-3 flex items-center gap-3">
                      <div>
                        <p className="text-lg font-bold font-display text-gray-700">{s.value.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Charts Row 1: Monthly Trend + Residence Pie ── */}
              <div className="report-section grid lg:grid-cols-2 gap-5 print-2col">

                {/* Monthly Trend — fixed pixel height for reliable print capture */}
                <div className="card">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                    Monthly Visitor Trend — {filters.year}
                  </h3>
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '11px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Line type="monotone" dataKey="Total"       stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="This Mun."   stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="Province"    stroke="#0891b2" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="Foreign"     stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Visitor Residence Pie */}
                <div className="card">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                    Visitor Distribution by Residence
                  </h3>
                  {residencePie.length > 0 ? (
                    <div style={{ width: '100%', height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={residencePie} cx="50%" cy="50%" outerRadius={80}
                            dataKey="value" label={renderLabel} labelLine={false}>
                            {residencePie.map((d, i) => <Cell key={i} fill={d.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '11px' }} />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-52 text-gray-300 text-sm">No visitor data</div>
                  )}
                </div>
              </div>

              {/* ── Charts Row 2: Type Breakdowns ── */}
              {(saeTypePie.length > 0 || steTypePie.length > 0) && (
                <div className="report-section grid lg:grid-cols-2 gap-5 print-2col">
                  {saeTypePie.length > 0 && (
                    <div className="card">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                        Accommodation Types
                      </h3>
                      <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={saeTypePie} cx="50%" cy="50%" outerRadius={70}
                              dataKey="value" label={renderLabel} labelLine={false}>
                              {saeTypePie.map((_, i) => <Cell key={i} fill={MUN_COLORS[i % MUN_COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '11px' }} />
                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                  {steTypePie.length > 0 && (
                    <div className="card">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                        Enterprise Types
                      </h3>
                      <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={steTypePie} cx="50%" cy="50%" outerRadius={70}
                              dataKey="value" label={renderLabel} labelLine={false}>
                              {steTypePie.map((_, i) => <Cell key={i} fill={MUN_COLORS[(i + 5) % MUN_COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '11px' }} />
                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Inventory by Municipality Table ── */}
              <div className="report-section card p-0 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-emerald-50">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                    Inventory by Municipality — All {MUNICIPALITIES.length} Municipalities
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table text-xs">
                    <thead>
                      <tr>
                        <th>Municipality</th>
                        <th>SAE</th><th>STA</th><th>STE</th>
                        <th>Rooms</th><th>Visitors</th>
                        <th>This Mun.</th><th>Province</th>
                        <th>Other Prov.</th><th>Foreign</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryMun.map((m) => (
                        <tr key={m.municipality}>
                          <td className="font-medium">{m.municipality}</td>
                          <td className="text-center">{m.sae || 0}</td>
                          <td className="text-center">{m.sta || 0}</td>
                          <td className="text-center">{m.ste || 0}</td>
                          <td className="text-center">{m.rooms || 0}</td>
                          <td className="text-center font-bold text-emerald-700">{m.visitors || 0}</td>
                          <td className="text-center">{m.thisMun || 0}</td>
                          <td className="text-center">{m.thisProvince || 0}</td>
                          <td className="text-center">{m.otherProvince || 0}</td>
                          <td className="text-center">{m.foreign || 0}</td>
                        </tr>
                      ))}
                      <tr className="bg-emerald-800 text-white font-bold">
                        <td>PROVINCE TOTAL</td>
                        {['sae','sta','ste','rooms','visitors','thisMun','thisProvince','otherProvince','foreign'].map(k => (
                          <td key={k} className="text-center">
                            {inventoryMun.reduce((s, m) => s + (m[k] || 0), 0)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Top Tourist Spots ── */}
              {(visitorStats?.bySpot?.length > 0) && (
                <div className="report-section card p-0 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-emerald-50">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                      Top Tourist Spots by Visitor Count
                    </h3>
                  </div>
                  <table className="data-table text-xs">
                    <thead>
                      <tr><th>Rank</th><th>Tourist Spot</th><th>Visitors</th><th>Share</th></tr>
                    </thead>
                    <tbody>
                      {visitorStats.bySpot.map((spot, i) => {
                        const share = visitorStats.total > 0
                          ? ((spot.count / visitorStats.total) * 100).toFixed(1) : '0.0';
                        return (
                          <tr key={i}>
                            <td>
                              <span className={`badge ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'badge-gray'}`}>
                                #{i + 1}
                              </span>
                            </td>
                            <td className="font-medium">{spot._id}</td>
                            <td><span className="font-bold text-emerald-700">{spot.count.toLocaleString()}</span></td>
                            <td>
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden no-print">
                                  <div className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${Math.min(100, Number(share) * 2)}%` }} />
                                </div>
                                <span className="text-xs text-gray-500">{share}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Print footer */}
              <div className="hidden print:block mt-4 pt-3 border-t-2 border-emerald-700">
                <p className="text-xs text-gray-500">
                  Tarlac Tourism Office · Province of Tarlac, Region III · Generated: {generatedDate}
                </p>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}
