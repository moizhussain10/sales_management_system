import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../services/api';

export default function AttendanceManagement({ baList = [] }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`${API_URL}manage_attendance.php?date=${selectedDate}`);
      if (res.data.status === 'success') {
        setAttendance(res.data.attendance || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const handleStatusChange = async (baId, status) => {
    try {
      setSaving(true);
      const res = await axios.post(`${API_URL}manage_attendance.php`, {
        ba_id: Number(baId),
        date: selectedDate,
        status,
        marked_by: 0,
        actor_role: 'admin',
      });

      if (res.data.status === 'success') {
        fetchAttendance();
      } else {
        alert(res.data.message || 'Failed to update attendance');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while updating attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-8 rounded-3xl text-white shadow-xl border border-sky-900/30">
        <span className="bg-sky-500/20 text-sky-300 text-[11px] font-black px-3.5 py-1 rounded-full border border-sky-500/30 uppercase tracking-widest">
          Attendance Control
        </span>
        <h2 className="text-3xl font-black mt-2 tracking-tight">BA Presence Management</h2>
        <p className="text-slate-300 text-xs mt-1">Admin can mark BA as present, absent, or day off for any date.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <h3 className="font-black text-xl text-slate-900">Daily Attendance</h3>
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold uppercase text-slate-500">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-slate-300 rounded-xl p-2.5 text-sm text-slate-800"
            />
          </div>
        </div>

        <div className="space-y-3">
          {baList.length === 0 ? (
            <p className="text-sm text-slate-500 py-8">No BA records available.</p>
          ) : (
            baList.map((ba) => {
              const current = attendance.find((row) => Number(row.ba_id) === Number(ba.id));
              const currentStatus = current ? current.status : 'absent';

              return (
                <div key={ba.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <div>
                    <p className="font-black text-slate-900">{ba.name}</p>
                    <p className="text-xs text-slate-500">@{ba.username} • {ba.location_name || 'No store assigned'}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={currentStatus}
                      onChange={(e) => handleStatusChange(ba.id, e.target.value)}
                      className="border border-slate-300 rounded-xl p-2.5 text-sm text-slate-800 font-semibold bg-white"
                      disabled={saving}
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="day_off">Day Off</option>
                    </select>
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                      currentStatus === 'present' ? 'bg-emerald-100 text-emerald-700' :
                      currentStatus === 'absent' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {currentStatus === 'present' ? 'Present' : currentStatus === 'absent' ? 'Absent' : 'Day Off'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
