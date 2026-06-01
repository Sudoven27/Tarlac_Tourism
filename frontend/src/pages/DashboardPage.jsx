import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import {
  FiHome, FiMapPin, FiBriefcase, FiUsers, FiCalendar,
  FiGlobe, FiUser, FiDownload, FiFilter, FiRefreshCw, FiCamera
} from 'react-icons/fi';
import { MdHotel, MdPark } from 'react-icons/md';
import api from '../services/api';
import ExcelDownloadButton from '../components/common/ExcelDownloadButton';
import { MUNICIPALITIES, REPORT_YEARS, MUN_COLORS } from '../utils/constants';
import toast from 'react-hot-toast';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const RESIDENCE_COLORS = {
  'This Municipality': '#059669',
  'This Province': '#0891b2',
  'Other Province': '#7c3aed',
  'Foreign': '#d97706'
};

const GENDER_COLORS = { 'Male': '#3b82f6', 'Female': '#ec4899', 'Other': '#8b5cf6' };

// ── Shared filter bar ─────────────────────────────────────────────────────────
function GraphFilterBar({ value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {['day','month','year','custom'].map(p => (
        <button key={p} onClick={() => onChange({ ...value, period: p })}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            value.period === p ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-emerald-100'}`}>
          {p === 'day' ? 'Today' : p === 'month' ? 'This Month' : p === 'year' ? 'This Year' : 'Custom'}
        </button>
      ))}
      {value.period === 'year' && (
        <select className="form-select py-1 text-xs w-auto" value={value.year}
          onChange={e => onChange({ ...value, year: e.target.value })}>
          {REPORT_YEARS.map(y => <option key={y}>{y}</option>)}
        </select>
      )}
      {value.period === 'custom' && (
        <>
          <input type="date" className="form-input py-1 text-xs w-auto" value={value.startDate || ''}
            onChange={e => onChange({ ...value, startDate: e.target.value })} />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" className="form-input py-1 text-xs w-auto" value={value.endDate || ''}
            onChange={e => onChange({ ...value, endDate: e.target.value })} />
        </>
      )}
    </div>
  );
}

// ── Chart card wrapper ────────────────────────────────────────────────────────
function ChartCard({ title, accent = 'emerald', children, id }) {
  const ref = useRef(null);
  const [saving, setSaving] = useState(false);

  const saveAsImage = async () => {
    if (!ref.current || saving) return;
    setSaving(true);
    try {
      // Wait a tick so recharts finishes painting
      await new Promise(r => setTimeout(r, 300));
      const { default: h2c } = await import('html2canvas');
      const canvas = await h2c(ref.current, {
        backgroundColor: '#ffffff', scale: 2,
        useCORS: true, allowTaint: true,
        logging: false, width: ref.current.scrollWidth,
        height: ref.current.scrollHeight
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(title || 'chart').replace(/\s+/g, '_')}.png`;
      a.click();
      toast.success('Chart saved as image!');
    } catch (e) {
      toast.error('Failed to save chart: ' + e.message);
    } finally { setSaving(false); }
  };

  return (
    <div className="card" ref={ref} id={id}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <div className={`w-1.5 h-5 rounded-full ${accent === 'gold' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          {title}
        </h3>
        <button onClick={saveAsImage} disabled={saving}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Save as image">
          {saving ? <div className="spinner w-3.5 h-3.5" /> : <FiCamera className="text-sm" />}
        </button>
      </div>
      {children}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'emerald' }) {
  return (
    <div className="card animate-fade-in py-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color === 'gold' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
        <Icon className="text-lg" />
      </div>
      <p className="text-2xl font-bold font-display text-gray-800">{typeof value === 'number' ? value.toLocaleString() : (value ?? 0)}</p>
      <p className="text-xs font-semibold text-gray-600 mt-1 leading-tight">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Custom label for pie ───────────────────────────────────────────────────────
const RADIAN = Math.PI / 180;
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  return <text x={cx + r * Math.cos(-midAngle * RADIAN)} y={cy + r * Math.sin(-midAngle * RADIAN)}
    fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="600">
    {`${(percent * 100).toFixed(0)}%`}
  </text>;
};

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyChart({ msg = 'No data available' }) {
  return (
    <div className="flex flex-col items-center justify-center h-44 gap-2 text-gray-300">
      <div className="text-4xl">📊</div>
      <p className="text-sm">{msg}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalFilters, setGlobalFilters] = useState({ year: 2026, municipality: '' });
  const [graphFilter, setGraphFilter] = useState({ period: 'year', year: 2026, startDate: '', endDate: '' });

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        year: globalFilters.year,
        period: graphFilter.period
      });
      if (globalFilters.municipality) params.append('municipality', globalFilters.municipality);
      if (graphFilter.year) params.append('year', graphFilter.year);
      if (graphFilter.startDate) params.append('startDate', graphFilter.startDate);
      if (graphFilter.endDate) params.append('endDate', graphFilter.endDate);
      const { data } = await api.get(`/dashboard/stats?${params}`);
      setStats(data.data);
    } catch { toast.error('Failed to load dashboard data'); }
    finally { setLoading(false); }
  }, [globalFilters, graphFilter]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Prepare chart data ────────────────────────────────────────────────────
  // 1. Visitor Overview (all 4 categories)
  const visitorOverview = stats ? [
    { name: 'This Municipality', value: stats.totals.thisMunVisitors, color: '#059669' },
    { name: 'This Province', value: stats.totals.thisProvinceVisitors, color: '#0891b2' },
    { name: 'Other Province', value: stats.totals.otherProvinceVisitors, color: '#7c3aed' },
    { name: 'Foreign', value: stats.totals.foreignVisitors, color: '#d97706' }
  ] : [];

  // 2. Municipality visitor distribution — ALL municipalities, 0 if none
  const munVisitorData = (stats?.inventoryByMunicipality || []).map(m => ({
    name: m.municipality.length > 12 ? m.municipality.slice(0, 12) + '…' : m.municipality,
    fullName: m.municipality,
    'This Municipality': m.thisMun,
    'This Province': m.thisProvince,
    'Other Province': m.otherProvince,
    'Foreign': m.foreign,
    Total: m.visitors
  }));

  // 3. Top Attractions
  const topAttractions = (stats?.visitorsBySpot || []).map(s => ({
    name: s._id?.length > 16 ? s._id.slice(0, 16) + '…' : s._id || 'Unknown',
    fullName: s._id || 'Unknown',
    Visitors: s.count,
    'This Mun.': s.thisMun || 0,
    'Province': s.thisProvince || 0,
    'Other Prov.': s.otherProvince || 0,
    Foreign: s.foreign || 0
  }));

  // 4. Gender distribution
  const genderData = stats ? [
    { name: 'Male', value: stats.totals.maleVisitors, color: '#3b82f6' },
    { name: 'Female', value: stats.totals.femaleVisitors, color: '#ec4899' },
    { name: 'Other', value: stats.totals.otherVisitors || 0, color: '#8b5cf6' }
  ].filter(d => d.value > 0) : [];

  // 5. Monthly trend — ALL 12 months
  const monthlyTrend = (stats?.visitorsByMonth || []).map(m => ({
    name: MONTHS_SHORT[m.month - 1],
    'Local': (m.thisMun || 0) + (m.thisProvince || 0),
    'Provincial': m.otherProvince || 0,
    'Foreign': m.foreign || 0,
    'Total': m.total || 0
  }));

  // Inventory by municipality
  const inventoryMun = stats?.inventoryByMunicipality || [];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center"><div className="spinner w-10 h-10 mx-auto mb-3" /><p className="text-emerald-700 text-sm">Loading dashboard...</p></div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Province of Tarlac — Tourism Inventory Supply Data</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={fetchStats} className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5">
            <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <ExcelDownloadButton municipality={globalFilters.municipality} year={globalFilters.year} />
        </div>
      </div>

      {/* ── Global Filters ── */}
      <div className="card py-3 px-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FiFilter className="text-emerald-500" />
            <span className="font-semibold text-xs uppercase tracking-wide">Global Filter</span>
          </div>
          <select className="form-select w-auto text-sm py-1.5" value={globalFilters.year}
            onChange={e => setGlobalFilters(f => ({ ...f, year: Number(e.target.value) }))}>
            {REPORT_YEARS.map(y => <option key={y}>{y}</option>)}
          </select>
          <select className="form-select w-auto text-sm py-1.5" value={globalFilters.municipality}
            onChange={e => setGlobalFilters(f => ({ ...f, municipality: e.target.value }))}>
            <option value="">All Municipalities</option>
            {MUNICIPALITIES.map(m => <option key={m}>{m}</option>)}
          </select>
          {globalFilters.municipality && (
            <button onClick={() => setGlobalFilters(f => ({ ...f, municipality: '' }))}
              className="text-xs text-red-400 hover:text-red-600 font-medium">✕ Clear</button>
          )}
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MdHotel} label="Accommodation Establishments" value={stats?.totals?.sae} sub="SAE records" color="emerald" />
        <StatCard icon={MdPark} label="Tourist Attractions" value={stats?.totals?.sta} sub="STA records" color="emerald" />
        <StatCard icon={FiBriefcase} label="Tourism Enterprises" value={stats?.totals?.ste} sub="STE records" color="gold" />
        <StatCard icon={FiUsers} label="Total Visitors" value={stats?.totals?.visitors} sub={`${stats?.totals?.foreignVisitors||0} foreign`} color="gold" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'This Municipality', value: stats?.totals?.thisMunVisitors || 0, icon: FiHome },
          { label: 'This Province', value: stats?.totals?.thisProvinceVisitors || 0, icon: FiMapPin },
          { label: 'Other Province', value: stats?.totals?.otherProvinceVisitors || 0, icon: FiUser },
          { label: 'Foreign Visitors', value: stats?.totals?.foreignVisitors || 0, icon: FiGlobe }
        ].map(s => (
          <div key={s.label} className="card flex items-center gap-3 py-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <s.icon className="text-emerald-500" />
            </div>
            <div>
              <p className="text-xl font-bold font-display text-gray-800">{s.value.toLocaleString()}</p>
              <p className="text-xs text-gray-400 leading-tight">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Graph Filter Bar (shared for all charts) ── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <FiFilter className="text-emerald-500" />
          <span className="text-sm font-semibold text-gray-600">Graph Period Filter</span>
        </div>
        <GraphFilterBar value={graphFilter} onChange={setGraphFilter} />
        <p className="text-xs text-gray-400">This filter applies to all visitor graphs below.</p>
      </div>

      {/* ── Graph 1: Visitor Overview ── */}
      <ChartCard title="Visitor Overview" id="chart-visitor-overview">
        {visitorOverview.every(d => d.value === 0) ? <EmptyChart msg="No visitor data for selected period" /> : (
          <div className="grid sm:grid-cols-2 gap-6 items-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={visitorOverview} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={renderPieLabel} labelLine={false}>
                  {visitorOverview.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {visitorOverview.map(d => (
                <div key={d.name} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-sm text-gray-600">{d.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">{d.value.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{stats?.totals?.visitors > 0 ? ((d.value / stats.totals.visitors) * 100).toFixed(1) + '%' : '0%'}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-sm font-bold text-emerald-700">Total Visitors</span>
                <p className="text-sm font-bold text-emerald-700">{(stats?.totals?.visitors || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </ChartCard>

      {/* ── Graph 2: Municipality Visitor Distribution (ALL municipalities) ── */}
      <ChartCard title="Municipality Visitor Distribution (All Municipalities)" id="chart-mun-visitors">
        {munVisitorData.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={munVisitorData} margin={{ top: 5, right: 10, left: -10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                labelFormatter={(_, p) => p?.[0]?.payload?.fullName || ''} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="This Municipality" stackId="a" fill="#059669" />
              <Bar dataKey="This Province" stackId="a" fill="#0891b2" />
              <Bar dataKey="Other Province" stackId="a" fill="#7c3aed" />
              <Bar dataKey="Foreign" stackId="a" fill="#d97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ── Graph 3: Top Attractions ── */}
      <ChartCard title="Top Tourist Attractions (Most Visited)" accent="gold" id="chart-top-attractions">
        {topAttractions.length === 0 ? <EmptyChart msg="No attraction visit data for selected period" /> : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topAttractions} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={110} />
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                labelFormatter={(_, p) => p?.[0]?.payload?.fullName || ''} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="This Mun." stackId="a" fill="#059669" />
              <Bar dataKey="Province" stackId="a" fill="#0891b2" />
              <Bar dataKey="Other Prov." stackId="a" fill="#7c3aed" />
              <Bar dataKey="Foreign" stackId="a" fill="#d97706" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* ── Graph 4: Gender Distribution ── */}
        <ChartCard title="Gender Distribution" id="chart-gender">
          {genderData.length === 0 ? <EmptyChart msg="No gender data for selected period" /> : (
            <div className="space-y-3">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={renderPieLabel} labelLine={false}>
                    {genderData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-2">
                {genderData.map(d => (
                  <div key={d.name} className="text-center p-2 rounded-xl" style={{ background: d.color + '15' }}>
                    <p className="text-lg font-bold" style={{ color: d.color }}>{d.value}</p>
                    <p className="text-xs text-gray-500">{d.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* ── Graph 5: Monthly Visitor Trend (all 12 months) ── */}
        <ChartCard title={`Monthly Visitor Trend — ${graphFilter.year || globalFilters.year}`} id="chart-monthly-trend">
          {monthlyTrend.every(m => m.Total === 0) ? <EmptyChart msg="No visitor data for selected year" /> : (
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={monthlyTrend} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="Total" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Local" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 2 }} />
                <Line type="monotone" dataKey="Provincial" stroke="#7c3aed" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 2 }} />
                <Line type="monotone" dataKey="Foreign" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Inventory by Municipality (all 17) ── */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <div className="w-1.5 h-5 bg-emerald-500 rounded-full" /> Inventory by Municipality (All {MUNICIPALITIES.length} Municipalities)
          </h3>
          <ExcelDownloadButton type="all" year={globalFilters.year} />
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Municipality</th>
                <th>Accommodation (SAE)</th>
                <th>Attractions (STA)</th>
                <th>Enterprises (STE)</th>
                <th>Total Rooms</th>
                <th>Total Visitors</th>
                <th>This Mun.</th>
                <th>Province</th>
                <th>Other Prov.</th>
                <th>Foreign</th>
              </tr>
            </thead>
            <tbody>
              {(inventoryMun.length > 0 ? inventoryMun : MUNICIPALITIES.map(m => ({
                municipality: m, sae: 0, sta: 0, ste: 0, rooms: 0, visitors: 0,
                thisMun: 0, thisProvince: 0, otherProvince: 0, foreign: 0
              }))).map((m, i) => (
                <tr key={m.municipality}>
                  <td className="font-medium text-gray-800">{m.municipality}</td>
                  <td className="text-center"><span className={m.sae > 0 ? 'font-semibold text-emerald-700' : 'text-gray-300'}>{m.sae}</span></td>
                  <td className="text-center"><span className={m.sta > 0 ? 'font-semibold text-emerald-700' : 'text-gray-300'}>{m.sta}</span></td>
                  <td className="text-center"><span className={m.ste > 0 ? 'font-semibold text-amber-600' : 'text-gray-300'}>{m.ste}</span></td>
                  <td className="text-center">{m.rooms || 0}</td>
                  <td className="text-center font-bold text-emerald-700">{m.visitors || 0}</td>
                  <td className="text-center text-xs">{m.thisMun || 0}</td>
                  <td className="text-center text-xs">{m.thisProvince || 0}</td>
                  <td className="text-center text-xs">{m.otherProvince || 0}</td>
                  <td className="text-center text-xs">{m.foreign || 0}</td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="bg-emerald-800 text-white font-bold">
                <td>TOTAL</td>
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

      {/* ── Recent Records ── */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <div className="w-1.5 h-5 bg-amber-500 rounded-full" /> Recent Supply Records
          </h3>
          <div className="space-y-2">
            {[...(stats?.recent?.sae||[]), ...(stats?.recent?.sta||[])]
              .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0,6).map((rec,i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${rec.nameOfEstablishment ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                    {rec.nameOfEstablishment ? 'AE' : 'TA'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{rec.nameOfEstablishment || rec.taName}</p>
                    <p className="text-xs text-gray-400">{rec.cityMun || rec.municipality}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{new Date(rec.createdAt).toLocaleDateString('en-PH', { month:'short', day:'numeric' })}</span>
              </div>
            ))}
            {!stats?.recent?.sae?.length && !stats?.recent?.sta?.length && (
              <p className="text-center text-gray-400 text-sm py-6">No recent records</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <div className="w-1.5 h-5 bg-emerald-500 rounded-full" /> Recent Visitor Arrivals
          </h3>
          <div className="space-y-2">
            {(stats?.recent?.visitors||[]).slice(0,6).map((v,i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${v.residenceType==='Foreign' ? 'bg-amber-500' : 'bg-blue-500'}`}>
                    {v.gender?.[0]||'V'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{v.firstName} {v.lastName}</p>
                    <p className="text-xs text-gray-400">{v.touristSpot} · {v.municipality}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{v.visitDate ? new Date(v.visitDate).toLocaleDateString('en-PH', { month:'short', day:'numeric' }) : ''}</span>
              </div>
            ))}
            {!stats?.recent?.visitors?.length && (
              <p className="text-center text-gray-400 text-sm py-6">No visitor records yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
