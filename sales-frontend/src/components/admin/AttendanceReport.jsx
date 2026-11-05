import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../services/api';

export default function AttendanceReport({ baList = [] }) {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ present: 0, absent: 0, day_off: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });

      const res = await axios.get(`${API_URL}manage_attendance.php?${params.toString()}`);
      if (res.data.status === 'success') {
        setRecords(res.data.attendance || []);
        setSummary(res.data.summary || { present: 0, absent: 0, day_off: 0, total: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const baMap = useMemo(() => {
    return baList.reduce((acc, ba) => {
      acc[Number(ba.id)] = ba;
      return acc;
    }, {});
  }, [baList]);

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return records.filter((row) => {
      const ba = baMap[Number(row.ba_id)] || {};
      const searchableText = [
        row.attendance_date,
        row.ba_name || ba.name,
        row.ba_username || ba.username,
        ba.location_name,
        row.note,
      ].filter(Boolean).join(' ').toLowerCase();

      return (!query || searchableText.includes(query)) &&
        (statusFilter === 'ALL' || row.status === statusFilter);
    });
  }, [records, baMap, searchTerm, statusFilter]);

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl text-white shadow-xl border border-indigo-900/30">
        <span className="bg-indigo-500/20 text-indigo-300 text-[11px] font-black px-3.5 py-1 rounded-full border border-indigo-500/30 uppercase tracking-widest">
          Attendance Report
        </span>
        <h2 className="text-3xl font-black mt-2 tracking-tight">BA Attendance Summary</h2>
        <p className="text-slate-300 text-xs mt-1">Track who was present, absent, or on day off across the selected date range.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex gap-3 items-center">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-slate-300 rounded-xl p-2.5 text-sm text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-slate-300 rounded-xl p-2.5 text-sm text-slate-800"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={fetchReport}
            className="bg-slate-900 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Present</p>
            <p className="text-2xl font-black text-emerald-700 mt-2">{summary.present}</p>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-rose-700">Absent</p>
            <p className="text-2xl font-black text-rose-700 mt-2">{summary.absent}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Day Off</p>
            <p className="text-2xl font-black text-amber-700 mt-2">{summary.day_off}</p>
          </div>
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">Total Records</p>
            <p className="text-2xl font-black text-slate-700 mt-2">{summary.total}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <h3 className="font-black text-xl text-slate-900 mb-4">Detailed Attendance Log</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search BA, username, location, note..."
            aria-label="Search attendance records"
            className="w-full border border-slate-300 rounded-xl p-2.5 text-sm text-slate-800"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter attendance by status"
            className="w-full border border-slate-300 rounded-xl p-2.5 text-sm text-slate-800 bg-white"
          >
            <option value="ALL">All statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="day_off">Day Off</option>
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 py-8">Loading report...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="text-sm text-slate-500 py-8">No attendance records found for this date range.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">BA</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Location</th>
                  <th className="py-3 pr-4">Note</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((row) => {
                  const ba = baMap[Number(row.ba_id)] || {};
                  const status = row.status || 'present';
                  return (
                    <tr key={`${row.ba_id}-${row.attendance_date}`} className="border-b border-slate-100 text-sm">
                      <td className="py-3 pr-4 text-slate-700">{row.attendance_date}</td>
                      <td className="py-3 pr-4">
                        <div className="font-bold text-slate-800">{row.ba_name || ba.name || 'Unknown BA'}</div>
                        <div className="text-[11px] text-slate-500">@{row.ba_username || ba.username || 'ba'}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                          status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                          status === 'absent' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : 'Day Off'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{ba.location_name || 'Unassigned'}</td>
                      <td className="py-3 pr-4 text-slate-600">{row.note || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
