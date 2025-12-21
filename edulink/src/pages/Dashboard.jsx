import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db, ref, onValue } from "../firebaseRTDB";
import { useAuth } from "../context/AuthContext";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid 
} from 'recharts';
import { 
  Users, AlertTriangle, Calendar, CheckCircle, Megaphone, TrendingUp, ChevronLeft, ChevronRight 
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Slider State
  const [activeIndex, setActiveIndex] = useState(0);

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
      
      // --- LOGIC: SHOW ONLY 5 MOST RECENT ---
      // 1. Sort by ID descending (Firebase IDs are time-based, so this puts newest first)
      // 2. Slice to keep only the first 5
      const top5 = list.sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);
      
      setAnnouncements(top5); 
      setLoading(false);
    });

    return () => { unsubStudents(); unsubAnnouncements(); };
  }, []);

  // --- AUTO SLIDER LOGIC ---
  useEffect(() => {
    if (announcements.length <= 1) return; 
    
    // Auto-slide every 5 seconds
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % announcements.length);
    }, 5000); 

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
  } else {
    myStudents = students;
    title = "School Admin Overview";
  }

  // --- GRAPH DATA PREP ---
  const classAttendanceData = [];
  if (user.role === 'admin') {
    const classMap = {};
    students.forEach(s => {
      if (!s.class) return;
      if (!classMap[s.class]) classMap[s.class] = { total: 0, count: 0 };
      classMap[s.class].total += (s.attendance || 0);
      classMap[s.class].count += 1;
    });
    Object.keys(classMap).forEach(cls => {
      classAttendanceData.push({ name: cls, attendance: Math.round(classMap[cls].total / classMap[cls].count) });
    });
  }

  const dailyAttendanceData = [
    { day: 'Mon', present: 95 }, { day: 'Tue', present: 92 }, { day: 'Wed', present: 98 }, 
    { day: 'Thu', present: 94 }, { day: 'Fri', present: 97 }
  ];

  const atRiskCount = myStudents.filter(s => s.grade < 50).length;
  const avgAttendance = myStudents.length > 0 ? Math.round(myStudents.reduce((acc, s) => acc + (s.attendance||0), 0) / myStudents.length) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      
      {/* 1. HEADER */}
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
              <CheckCircle size={18} /> Take Attendance
            </Link>
          )}
        </div>
      </div>

      {/* 2. ANNOUNCEMENT SLIDER (CAROUSEL) */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl relative overflow-hidden text-white min-h-[180px] flex items-center">
        {/* Decorative BG */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>

        {announcements.length === 0 ? (
          <div className="w-full text-center p-8 opacity-80 italic">No recent announcements.</div>
        ) : (
          <div className="w-full flex items-center justify-between px-2 md:px-6 py-6 relative z-10">
            
            {/* Prev Button */}
            <button onClick={prevSlide} className="p-2 rounded-full hover:bg-white/20 transition hidden md:block">
              <ChevronLeft size={24} />
            </button>

            {/* Content Content */}
            <div className="flex-1 px-4 md:px-12 text-center">
              <div className="flex justify-center items-center gap-2 mb-3 opacity-90">
                <Megaphone className="text-yellow-300" size={20} />
                <span className={`text-[10px] md:text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${announcements[activeIndex].target==='All' ? 'bg-purple-500' : 'bg-emerald-500'}`}>
                  {announcements[activeIndex].target === 'All' ? 'School Wide' : announcements[activeIndex].target}
                </span>
                <span className="text-xs opacity-75">• {announcements[activeIndex].date}</span>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold mb-2 leading-tight transition-all duration-300">
                {announcements[activeIndex].title}
              </h2>
              <p className="text-blue-100 text-sm md:text-base max-w-2xl mx-auto line-clamp-2">
                {announcements[activeIndex].body}
              </p>

              {/* Dots Indicator */}
              <div className="flex justify-center gap-2 mt-6">
                {announcements.map((_, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${idx === activeIndex ? 'w-6 bg-white' : 'w-2 bg-white/40'}`}
                  />
                ))}
              </div>
            </div>

            {/* Next Button */}
            <button onClick={nextSlide} className="p-2 rounded-full hover:bg-white/20 transition hidden md:block">
              <ChevronRight size={24} />
            </button>
          </div>
        )}
      </div>

      {/* 3. STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Students" value={myStudents.length} icon={<Users size={24} className="text-blue-600" />} bg="bg-white" border="border-l-4 border-blue-500" />
        <StatCard title="Avg Attendance" value={`${avgAttendance}%`} icon={<TrendingUp size={24} className="text-emerald-600" />} bg="bg-white" border="border-l-4 border-emerald-500" />
        <StatCard title="Students At Risk" value={atRiskCount} icon={<AlertTriangle size={24} className="text-red-600" />} bg="bg-white" border="border-l-4 border-red-500" />
      </div>

      {/* 4. MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* GRAPH SECTION */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          {user.role === 'admin' && (
            <>
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-500" /> Attendance by Class (Last Week)
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classAttendanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{ borderRadius: '8px' }} />
                    <Bar dataKey="attendance" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} name="Attendance %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {user.role === 'teacher' && (
            <>
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-emerald-500" /> Daily Attendance Trend
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyAttendanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="present" stroke="#10B981" strokeWidth={3} dot={{r: 4, fill: '#10B981'}} activeDot={{r: 6}} name="Attendance %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {user.role === 'parent' && (
             <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
               <div className="bg-slate-100 p-4 rounded-full"><Megaphone className="text-slate-400" size={32}/></div>
               <p className="text-slate-500 italic max-w-md">Use the announcement slider above to check important school updates, or check the Report card page for detailed marks.</p>
             </div>
          )}
        </div>

        {/* STUDENT LIST */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[400px]">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Student List</h3>
            <Link to="/reports" className="text-xs text-blue-600 font-bold uppercase hover:underline">View All</Link>
          </div>
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left">
              <tbody className="divide-y text-sm">
                {myStudents.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 font-medium text-slate-700">
                      {s.name}
                      <p className="text-[10px] text-slate-400">{s.class}</p>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${s.attendance >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {s.attendance}% Att.
                      </span>
                    </td>
                  </tr>
                ))}
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
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <h2 className="text-3xl font-extrabold text-slate-800">{value}</h2>
      </div>
      <div className="bg-slate-50 p-3 rounded-lg">{icon}</div>
    </div>
  );
}