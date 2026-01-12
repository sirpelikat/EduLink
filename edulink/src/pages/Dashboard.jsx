import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { db, ref, onValue } from "../firebaseRTDB";
import { useAuth } from "../context/AuthContext";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell 
} from 'recharts';
import { 
  Users, AlertTriangle, Calendar, CheckCircle, Megaphone, TrendingUp, ChevronLeft, ChevronRight, BookOpen, Clock, ArrowRight, AlertCircle 
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [rawAnnouncements, setRawAnnouncements] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [activeIndex, setActiveIndex] = useState(0); 
  const [selectedTerm, setSelectedTerm] = useState('t1'); 

  // --- SUBJECTS CONFIGURATION ---
  // Ensure these match your Database keys (e.g. t1_subj_sejarah)
  const ALL_SUBJECTS = ['bm', 'english', 'math', 'science', 'sejarah', 'geografi'];

  useEffect(() => {
    if (!user) return;

    // 1. Fetch Students
    const unsubStudents = onValue(ref(db, "students"), (snapshot) => {
      const data = snapshot.val();
      // We map the data to an array, ensuring 'caseStatus' and all fields are included
      setStudents(data ? Object.entries(data).map(([id, value]) => ({ id, ...value })) : []);
    });

    // 2. Fetch Announcements
    const unsubAnnouncements = onValue(ref(db, "announcements"), (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [];
      setRawAnnouncements(list.sort((a, b) => b.id.localeCompare(a.id))); 
      setLoading(false);
    });

    return () => { unsubStudents(); unsubAnnouncements(); };
  }, [user]);

  // --- DYNAMIC ANNOUNCEMENT FILTERING ---
  const announcements = rawAnnouncements.filter(ann => {
    const target = ann.target || 'All';
    const targetLower = target.toLowerCase();

    if (target === 'All') return true;

    if (user.role === 'parent') {
        if (targetLower === 'parents') return true;
        const myKids = students.filter(s => s.parentId === user.uid);
        if (myKids.some(kid => kid.class === target)) return true;
    }

    if (user.role === 'teacher') {
        if (targetLower === 'teachers') return true;
        if (user.class && target === user.class) return true;
    }

    return false;
  }).slice(0, 5);

  // --- AUTO SLIDER LOGIC ---
  useEffect(() => {
    if (announcements.length <= 1) return; 
    const interval = setInterval(() => setActiveIndex((c) => (c + 1) % announcements.length), 5000); 
    return () => clearInterval(interval);
  }, [announcements.length]);

  if (!user) {
    return <Navigate to="/EduLink/login" replace />;
  }

  const nextSlide = () => setActiveIndex((curr) => (curr + 1) % announcements.length);
  const prevSlide = () => setActiveIndex((curr) => (curr === 0 ? announcements.length - 1 : curr - 1));

  if (loading) return <div className="p-10 text-center text-slate-500 animate-pulse">Loading dashboard...</div>;

  // --- FILTER DATA FOR WIDGETS ---
  let myStudents = [];
  let title = "Dashboard";

  if (user.role === 'parent') {
    myStudents = students.filter(s => s.parentId === user.uid);
    title = "My Family";
  } else if (user.role === 'teacher') {
    myStudents = students.filter(s => s.class === user.class);
    title = `Class ${user.class}`;
  } else if (user.role === 'counselor') {
    myStudents = students; 
    title = "Counselor Overview";
  } else {
    myStudents = students; 
    title = "Admin Overview";
  }

  // --- RISK ALGORITHM ---
  const analyzeStudentRisk = (student) => {
    let priority = 'Normal';
    ['t1', 't2'].forEach(term => {
       const att = Number(student[`${term}_attendance`] || 100);
       const cocu = Number(student[`${term}_cocu_attendance`] || 100);

       if (att < 50 || cocu < 50) priority = 'High';
       else if ((att < 80 || cocu < 80) && priority !== 'High') priority = 'Low';

       ALL_SUBJECTS.forEach(sub => {
          const val = student[`${term}_subj_${sub}`];
          if (val !== undefined) {
             const score = Number(val);
             if (score < 50) priority = 'High';
          }
       });
    });

    if (priority === 'Normal') return null;
    return { priority }; 
  };

  // --- GENERATE RISK LIST (FILTERED) ---
  const atRiskList = myStudents
    .map(s => ({...s, risk: analyzeStudentRisk(s)}))
    // FILTER: Only show student if they have a risk AND caseStatus is NOT Resolved
    .filter(s => s.risk && (s.caseStatus || 'Unresolved') !== 'Resolved');

  atRiskList.sort((a, b) => (a.risk.priority === 'High' ? -1 : 1));

  // --- CHART DATA GENERATION ---
  const subjectAvgData = [];
  if (user.role === 'teacher') {
    // Labels corresponding to Database Keys
    const subjectLabels = { 
        bm: 'BM', 
        english: 'BI', 
        math: 'Matematik', 
        science: 'Sains',
        sejarah: 'P.Islam/Moral', 
        geografi: 'P.Jasmani'     
    };
    const stats = {};
    
    ALL_SUBJECTS.forEach(sub => stats[sub] = { total: 0, count: 0 });

    myStudents.forEach(s => {
      ALL_SUBJECTS.forEach(sub => {
        const val = s[`${selectedTerm}_subj_${sub}`];
        if (val) { 
            stats[sub].total += Number(val); 
            stats[sub].count += 1; 
        }
      });
    });

    ALL_SUBJECTS.forEach(sub => {
       if (stats[sub].count > 0) {
         subjectAvgData.push({ 
           name: subjectLabels[sub], 
           avg: Math.round(stats[sub].total / stats[sub].count) 
         });
       }
    });
  }

  const avgAttendance = myStudents.length > 0 
    ? Math.round(myStudents.reduce((acc, s) => acc + Number(s.attendance||0), 0) / myStudents.length) 
    : 0;

  const BAR_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'];

  return (
    <div className="w-full mx-auto space-y-6 md:space-y-8 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{title}</h1>
          <p className="text-slate-500 flex items-center gap-2 text-sm md:text-base">
            <Calendar size={16} /> {new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          {user.role === 'teacher' && (
            <Link to="/EduLink/reports" className="flex-1 md:flex-none justify-center items-center gap-2 bg-indigo-600 text-white px-4 py-3 md:py-2 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex">
              <CheckCircle size={18} /> Manage Marks
            </Link>
          )}
        </div>
      </div>

      {/* ANNOUNCEMENT SLIDER */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl relative overflow-hidden text-white min-h-[180px] flex items-center">
        <div className="hidden md:block absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
        
        {announcements.length === 0 ? (
          <div className="w-full text-center p-8 opacity-80 italic">No announcements for you yet.</div>
        ) : (
          <div className="w-full flex items-center justify-between px-2 md:px-6 py-6 relative z-10">
            <button onClick={prevSlide} className="p-2 rounded-full hover:bg-white/20 transition active:scale-95">
              <ChevronLeft size={24} />
            </button>
            
            <div className="flex-1 px-2 md:px-12 text-center">
              <div className="flex flex-col md:flex-row justify-center items-center gap-2 mb-3 opacity-90">
                <div className="flex items-center gap-2">
                  <Megaphone className="text-yellow-300" size={16} />
                  <span className={`text-[10px] md:text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${announcements[activeIndex].target==='All' ? 'bg-purple-500' : 'bg-emerald-500'}`}>
                    {announcements[activeIndex].target === 'All' ? 'School Wide' : announcements[activeIndex].target}
                  </span>
                </div>
                <span className="text-xs opacity-75 hidden md:inline">• {announcements[activeIndex].date}</span>
              </div>
              
              <h2 className="text-lg md:text-3xl font-bold mb-2 leading-tight transition-all duration-300 line-clamp-2">
                {announcements[activeIndex].title}
              </h2>
              <p className="text-blue-100 text-xs md:text-base max-w-2xl mx-auto line-clamp-2 md:line-clamp-2">
                {announcements[activeIndex].body}
              </p>
              
              <div className="flex justify-center gap-2 mt-4 md:mt-6">
                {announcements.map((_, idx) => (
                  <button key={idx} onClick={() => setActiveIndex(idx)} className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${idx === activeIndex ? 'w-4 md:w-6 bg-white' : 'w-1.5 md:w-2 bg-white/40'}`} />
                ))}
              </div>
            </div>

            <button onClick={nextSlide} className="p-2 rounded-full hover:bg-white/20 transition active:scale-95">
              <ChevronRight size={24} />
            </button>
          </div>
        )}
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard title="Total Students" value={myStudents.length} icon={<Users size={24} className="text-blue-600" />} bg="bg-white" border="border-l-4 border-blue-500" />
        <StatCard title="Avg Attendance" value={`${avgAttendance}%`} icon={<TrendingUp size={24} className="text-emerald-600" />} bg="bg-white" border="border-l-4 border-emerald-500" />
        <StatCard title="Active Risks" value={atRiskList.length} icon={<AlertTriangle size={24} className="text-red-600" />} bg="bg-white" border="border-l-4 border-red-500" />
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Charts/Risk */}
        {user.role !== 'parent' && (
          <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            
            {/* Risk List (Admin/Counselor) - Filtered by Resolved */}
            {(user.role === 'admin' || user.role === 'counselor') && (
              <>
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <AlertTriangle size={20} className="text-red-500" /> Students Needing Support
                </h3>
                {atRiskList.length > 0 ? (
                  <div className="overflow-y-auto h-72 pr-2 custom-scrollbar">
                    <div className="grid gap-3">
                      {atRiskList.map(s => (
                        <div key={s.id} className={`flex items-center justify-between p-4 rounded-xl bg-white border-l-4 ${s.risk.priority === 'High' ? 'border-l-red-500 bg-red-50/50' : 'border-l-amber-400 bg-amber-50/50'} border border-slate-100`}>
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className={`h-8 w-8 md:h-10 md:w-10 min-w-[2rem] rounded-full font-bold flex items-center justify-center text-white ${s.risk.priority === 'High' ? 'bg-red-500' : 'bg-amber-400'}`}>
                              {s.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-slate-800 text-sm truncate max-w-[120px] md:max-w-none">{s.name}</p>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${s.risk.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {s.risk.priority}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 font-mono">{s.class}</p>
                            </div>
                          </div>
                          <Link to="/EduLink/wellbeing" className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100">
                            <ArrowRight size={16}/>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-72 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <CheckCircle size={32} className="text-emerald-400 mb-2"/>
                    <p className="font-medium text-slate-600">No Active Risks Found</p>
                  </div>
                )}
              </>
            )}

            {/* Charts (Teacher) */}
            {user.role === 'teacher' && (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <BookOpen size={20} className="text-indigo-500" /> Class Performance
                  </h3>
                  <div className="flex bg-slate-100 p-1 rounded-lg self-end sm:self-auto">
                    {['t1', 't2'].map((term) => (
                      <button 
                        key={term} 
                        onClick={() => setSelectedTerm(term)} 
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${selectedTerm === term ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {term.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="h-64 md:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectAvgData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                      <Tooltip cursor={{fill: '#F1F5F9'}} />
                      <Bar dataKey="avg" radius={[4, 4, 0, 0]} barSize={32}>
                        {subjectAvgData.map((entry, index) => <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}

        {/* RIGHT COLUMN: Student List */}
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[400px] ${user.role === 'parent' ? 'lg:col-span-3 h-auto min-h-[400px]' : ''}`}>
          <div className="p-4 md:p-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
              <Users size={18} className="text-blue-500"/> {user.role === 'parent' ? 'My Children' : 'Student List'}
            </h3>
            {user.role !== 'parent' && (
              <Link to="/EduLink/reports" className="text-xs text-blue-600 font-bold uppercase hover:underline">View All</Link>
            )}
          </div>
          <div className="overflow-y-auto overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left min-w-[300px]">
              <thead className="bg-slate-50 text-xs uppercase text-slate-400 font-semibold">
                <tr>
                  <th className="px-4 md:px-6 py-3">Name</th>
                  <th className="px-4 md:px-6 py-3 text-right">Attd.</th>
                  {user.role === 'parent' && <th className="px-4 md:px-6 py-3 text-right">Avg Grade</th>}
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {myStudents.map(s => {
                  let total = 0;
                  let count = 0;
                  ALL_SUBJECTS.forEach(sub => {
                    const val = s[`t1_subj_${sub}`]; 
                    if(val) { total += Number(val); count++; }
                  });
                  const avg = count > 0 ? Math.round(total / count) : 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 md:px-6 py-3 font-medium text-slate-700">
                        <div className="truncate w-32 md:w-auto">{s.name}</div>
                        <p className="text-[10px] text-slate-400">{s.class}</p>
                      </td>
                      <td className="px-4 md:px-6 py-3 text-right">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${s.attendance >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {s.attendance}%
                        </span>
                      </td>
                      {user.role === 'parent' && (
                        <td className="px-4 md:px-6 py-3 text-right font-bold text-slate-700">
                          {count > 0 ? <span>{avg}%</span> : <Clock size={12}/>}
                        </td>
                      )}
                    </tr>
                  )
                })}
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
    <div className={`${bg} ${border} p-4 md:p-6 rounded-xl shadow-sm flex items-center justify-between`}>
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">{value}</h2>
      </div>
      <div className="bg-slate-50 p-2 md:p-3 rounded-lg">{icon}</div>
    </div>
  );
}