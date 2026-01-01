import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db, ref, onValue } from "../firebaseRTDB";
import { useAuth } from "../context/AuthContext";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell 
} from 'recharts';
import { 
  Users, AlertTriangle, Calendar, CheckCircle, Megaphone, TrendingUp, ChevronLeft, ChevronRight, BookOpen, Clock, Heart, ArrowRight 
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States
  const [activeIndex, setActiveIndex] = useState(0); // Slider
  const [selectedTerm, setSelectedTerm] = useState('t1'); // Term Selector

  useEffect(() => {
    // 1. Fetch Students
    const unsubStudents = onValue(ref(db, "students"), (snapshot) => {
      const data = snapshot.val();
      setStudents(data ? Object.entries(data).map(([id, value]) => ({ id, ...value })) : []);
    });

    // 2. Fetch Announcements
    const unsubAnnouncements = onValue(ref(db, "announcements"), (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [];
      const top5 = list.sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);
      setAnnouncements(top5); 
      setLoading(false);
    });

    return () => { unsubStudents(); unsubAnnouncements(); };
  }, []);

  // --- AUTO SLIDER ---
  useEffect(() => {
    if (announcements.length <= 1) return; 
    const interval = setInterval(() => setActiveIndex((c) => (c + 1) % announcements.length), 5000); 
    return () => clearInterval(interval);
  }, [announcements.length]);

  const nextSlide = () => setActiveIndex((curr) => (curr + 1) % announcements.length);
  const prevSlide = () => setActiveIndex((curr) => (curr === 0 ? announcements.length - 1 : curr - 1));

  if (loading) return <div className="p-10 text-center text-slate-500 animate-pulse">Loading dashboard...</div>;

  // --- FILTER DATA ---
  let myStudents = [];
  let title = "Dashboard";

  if (user.role === 'parent') {
    myStudents = students.filter(s => s.parentId === user.uid);
    title = "My Family Overview";
  } else if (user.role === 'teacher') {
    myStudents = students.filter(s => s.class === user.class);
    title = `Class ${user.class} Overview`;
  } else if (user.role === 'counselor') {
    myStudents = students; // Counselor sees all students
    title = "Counselor Overview";
  } else {
    myStudents = students;
    title = "School Admin Overview";
  }

  // --- 1. AT RISK LIST (Admin AND Counselor) ---
  const atRiskStudentsList = (user.role === 'admin' || user.role === 'counselor') 
    ? students.filter(s => s.t1_total_score && (s.t1_total_score / 4) < 50) 
    : [];

  // --- 2. TEACHER DATA ---
  const subjectAvgData = [];
  if (user.role === 'teacher') {
    const subjects = ['bm', 'english', 'math', 'science'];
    const subjectLabels = { bm: 'BM', english: 'English', math: 'Math', science: 'Science' };
    const stats = {};
    subjects.forEach(sub => stats[sub] = { total: 0, count: 0 });

    myStudents.forEach(s => {
      subjects.forEach(sub => {
        const key = `${selectedTerm}_subj_${sub}`;
        const val = s[key];
        if (val) { stats[sub].total += Number(val); stats[sub].count += 1; }
      });
    });

    subjects.forEach(sub => {
       if (stats[sub].count > 0) subjectAvgData.push({ name: subjectLabels[sub], avg: Math.round(stats[sub].total / stats[sub].count) });
    });
  }

  const avgAttendance = myStudents.length > 0 ? Math.round(myStudents.reduce((acc, s) => acc + Number(s.attendance||0), 0) / myStudents.length) : 0;
  const BAR_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

  return (
    <div className="p-6 w-full mx-auto space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">{title}</h1>
          <p className="text-slate-500 flex items-center gap-2">
            <Calendar size={16} /> {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3">
          {user.role === 'teacher' && (
            <Link to="/reports" className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
              <CheckCircle size={18} /> Manage Marks
            </Link>
          )}
        </div>
      </div>

      {/* SLIDER */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl relative overflow-hidden text-white min-h-[180px] flex items-center">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
        {announcements.length === 0 ? (
          <div className="w-full text-center p-8 opacity-80 italic">No recent announcements.</div>
        ) : (
          <div className="w-full flex items-center justify-between px-2 md:px-6 py-6 relative z-10">
            <button onClick={prevSlide} className="p-2 rounded-full hover:bg-white/20 transition hidden md:block"><ChevronLeft size={24} /></button>
            <div className="flex-1 px-4 md:px-12 text-center">
              <div className="flex justify-center items-center gap-2 mb-3 opacity-90">
                <Megaphone className="text-yellow-300" size={20} />
                <span className={`text-[10px] md:text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${announcements[activeIndex].target==='All' ? 'bg-purple-500' : 'bg-emerald-500'}`}>
                  {announcements[activeIndex].target === 'All' ? 'School Wide' : announcements[activeIndex].target}
                </span>
                <span className="text-xs opacity-75">• {announcements[activeIndex].date}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 leading-tight transition-all duration-300">{announcements[activeIndex].title}</h2>
              <p className="text-blue-100 text-sm md:text-base max-w-2xl mx-auto line-clamp-2">{announcements[activeIndex].body}</p>
              <div className="flex justify-center gap-2 mt-6">
                {announcements.map((_, idx) => (
                  <button key={idx} onClick={() => setActiveIndex(idx)} className={`h-2 rounded-full transition-all duration-300 ${idx === activeIndex ? 'w-6 bg-white' : 'w-2 bg-white/40'}`} />
                ))}
              </div>
            </div>
            <button onClick={nextSlide} className="p-2 rounded-full hover:bg-white/20 transition hidden md:block"><ChevronRight size={24} /></button>
          </div>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Students" value={myStudents.length} icon={<Users size={24} className="text-blue-600" />} bg="bg-white" border="border-l-4 border-blue-500" />
        <StatCard title="Avg Attendance" value={`${avgAttendance}%`} icon={<TrendingUp size={24} className="text-emerald-600" />} bg="bg-white" border="border-l-4 border-emerald-500" />
        <StatCard title="Students At Risk" value={atRiskStudentsList.length} icon={<AlertTriangle size={24} className="text-red-600" />} bg="bg-white" border="border-l-4 border-red-500" />
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN */}
        {user.role !== 'parent' && (
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            
            {/* ADMIN / COUNSELOR VIEW: AT RISK LIST */}
            {(user.role === 'admin' || user.role === 'counselor') && (
              <>
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <AlertTriangle size={20} className="text-red-500" /> Students Needing Support (Avg &lt; 50%)
                </h3>
                {atRiskStudentsList.length > 0 ? (
                  <div className="overflow-y-auto h-72 pr-2 custom-scrollbar">
                    <div className="grid gap-3">
                      {atRiskStudentsList.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100 transition group">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-white text-red-500 font-bold flex items-center justify-center border border-red-200">{s.name.charAt(0)}</div>
                            <div>
                              <p className="font-bold text-slate-800">{s.name}</p>
                              <p className="text-xs text-red-600 font-semibold">{s.class} • Avg: {Math.round(s.t1_total_score/4)}%</p>
                            </div>
                          </div>
                          
                          {/* LINK TO WELLBEING */}
                          <Link to="/wellbeing" className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-bold text-red-600 bg-white px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50">
                            Check Wellbeing <ArrowRight size={14}/>
                          </Link>

                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-72 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <CheckCircle size={32} className="text-emerald-400 mb-2"/>
                    <p className="font-medium text-slate-600">No At-Risk Students Found</p>
                  </div>
                )}
              </>
            )}

            {/* TEACHER VIEW */}
            {user.role === 'teacher' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <BookOpen size={20} className="text-indigo-500" /> Class Performance
                  </h3>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    {['t1', 't2'].map((term) => (
                      <button key={term} onClick={() => setSelectedTerm(term)} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${selectedTerm === term ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{term.toUpperCase()}</button>
                    ))}
                  </div>
                </div>

                {subjectAvgData.length > 0 ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectAvgData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                        <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{ borderRadius: '8px' }} />
                        <Bar dataKey="avg" radius={[6, 6, 0, 0]} barSize={50} name="Avg Score">
                          {subjectAvgData.map((entry, index) => <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-72 flex flex-col items-center justify-center text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <BookOpen size={32} className="mb-2 opacity-50"/>
                    <p>No data available for {selectedTerm.toUpperCase()}</p>
                    <Link to="/reports" className="text-indigo-500 text-xs font-bold mt-2 hover:underline">Add Marks Now</Link>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* RIGHT COLUMN: STUDENT LIST */}
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[400px] ${user.role === 'parent' ? 'lg:col-span-3 h-auto min-h-[400px]' : ''}`}>
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users size={18} className="text-blue-500"/> {user.role === 'parent' ? 'My Children' : 'Student List'}</h3>
            <Link to="/reports" className="text-xs text-blue-600 font-bold uppercase hover:underline">View All</Link>
          </div>
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-400 font-semibold">
                <tr><th className="px-6 py-3">Name</th><th className="px-6 py-3 text-right">Attendance</th>{user.role === 'parent' && <th className="px-6 py-3 text-right">Avg Grade</th>}</tr>
              </thead>
              <tbody className="divide-y text-sm">
                {myStudents.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 font-medium text-slate-700">{s.name}<p className="text-[10px] text-slate-400">{s.class}</p></td>
                    <td className="px-6 py-3 text-right"><span className={`px-2 py-1 rounded text-xs font-bold ${s.attendance >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{s.attendance}%</span></td>
                    {user.role === 'parent' && (
                      <td className="px-6 py-3 text-right font-bold text-slate-700">{s.t1_total_score ? <span>{Math.round(s.t1_total_score / 4)}%</span> : <span className="flex items-center justify-end gap-1 text-slate-400 text-[10px] uppercase font-bold tracking-wider"><Clock size={12}/> Not Keyed In</span>}</td>
                    )}
                  </tr>
                ))}
                {myStudents.length === 0 && <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-400 italic">No students found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, bg, border }) {
  return (
    <div className={`${bg} ${border} p-6 rounded-xl shadow-sm flex items-center justify-between transform hover:-translate-y-1 transition duration-300`}>
      <div><p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p><h2 className="text-3xl font-extrabold text-slate-800">{value}</h2></div>
      <div className="bg-slate-50 p-3 rounded-lg">{icon}</div>
    </div>
  );
}