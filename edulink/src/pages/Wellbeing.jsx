import React, { useEffect, useState } from 'react'
import { db, ref, onValue } from '../firebaseRTDB'
import { useAuth } from '../context/AuthContext'
import { 
  AlertCircle, Calendar, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Search, X, AlertTriangle, CheckCircle 
} from 'lucide-react'
import { 
  BarChart, Bar, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function Wellbeing() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- HELPER: Analyze Single Term ---
  const analyzeTerm = (student, termPrefix) => {
    const issues = {
      attendance: null,
      cocu: null,
      failingSubjects: [],
      priority: 'Normal', 
      avgGrade: 0
    };

    // 1. Get Data
    const att = Number(student[`${termPrefix}_attendance`] || 100);
    const cocu = Number(student[`${termPrefix}_cocu_attendance`] || 100);
    
    // Calculate Subject Averages
    const subjects = {
      'subj_bm': 'Bahasa Melayu', 'subj_english': 'English', 
      'subj_math': 'Mathematics', 'subj_science': 'Science'
    };
    
    let totalScore = 0;
    let count = 0;

    Object.entries(subjects).forEach(([key, label]) => {
      const val = student[`${termPrefix}_${key}`];
      if (val !== undefined) {
        const score = Number(val);
        totalScore += score;
        count++;
        if (score < 50) issues.failingSubjects.push({ subject: label, score, level: 'High' });
        else if (score < 80) issues.failingSubjects.push({ subject: label, score, level: 'Low' });
      }
    });

    issues.avgGrade = count > 0 ? Math.round(totalScore / count) : 0;
    
    // 2. Determine Priority
    const isHigh = att < 50 || cocu < 50 || issues.failingSubjects.some(s => s.score < 50);
    const isLow = !isHigh && (att < 80 || cocu < 80 || issues.failingSubjects.some(s => s.score < 80));

    if (isHigh) issues.priority = 'High';
    else if (isLow) issues.priority = 'Low';

    if (att < 80) issues.attendance = { value: att, level: att < 50 ? 'High' : 'Low' };
    if (cocu < 80) issues.cocu = { value: cocu, level: cocu < 50 ? 'High' : 'Low' };

    return issues;
  };

  // --- FETCH & PROCESS DATA ---
  useEffect(() => {
    const unsub = onValue(ref(db, "students"), (snap) => {
      const data = snap.val();
      if (!data) { setAlerts([]); setLoading(false); return; }
      
      const allStudents = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      
      // 1. Role Filter
      let relevantStudents = [];
      if (user.role === 'parent') relevantStudents = allStudents.filter(s => s.parentId === user.uid);
      else if (user.role === 'teacher') relevantStudents = allStudents.filter(s => s.class === user.class);
      else relevantStudents = allStudents; // Admin

      // 2. Analyze
      const processed = relevantStudents.map(s => {
        const t1 = analyzeTerm(s, 't1');
        const t2 = analyzeTerm(s, 't2');
        
        let overallPriority = 'Normal';
        if (t1.priority === 'High' || t2.priority === 'High') overallPriority = 'High';
        else if (t1.priority === 'Low' || t2.priority === 'Low') overallPriority = 'Low';

        return { ...s, t1, t2, overallPriority };
      }).filter(s => s.overallPriority !== 'Normal');

      // 3. Sort Alphabetical only (Grouping happens in Render)
      processed.sort((a, b) => a.name.localeCompare(b.name));
      
      setAlerts(processed);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading Well-Being data...</div>;

  // --- FILTER & SPLIT LOGIC ---
  const filtered = alerts.filter(s => 
    !searchTerm.trim() || 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const highPriorityList = filtered.filter(s => s.overallPriority === 'High');
  const lowPriorityList = filtered.filter(s => s.overallPriority === 'Low');

  return (
    <div className="p-4 max-w-5xl mx-auto">
      
      {/* HEADER & SEARCH */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-2 z-20">
        <div className="flex items-center gap-3">
            <div className="bg-red-50 p-2 rounded-lg text-red-600">
               <AlertCircle size={24} />
            </div>
            <div>
                <h1 className="text-xl font-bold text-slate-800 leading-tight">Well-Being Monitor</h1>
                <p className="text-xs text-slate-500 font-medium">
                  {filtered.length} students identified at risk
                </p>
            </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72 group">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search student or class..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="space-y-8">
        
        {/* SECTION 1: HIGH PRIORITY */}
        {highPriorityList.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
               <AlertTriangle size={18} className="text-red-500" />
               <h2 className="text-sm font-bold text-red-800 uppercase tracking-wider">High Priority Cases</h2>
               <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{highPriorityList.length}</span>
            </div>
            {highPriorityList.map(s => <CompactStudentCard key={s.id} student={s} />)}
          </div>
        )}

        {/* SECTION 2: LOW PRIORITY */}
        {lowPriorityList.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1 mt-6">
               <AlertCircle size={18} className="text-amber-500" />
               <h2 className="text-sm font-bold text-amber-800 uppercase tracking-wider">Low Priority Cases</h2>
               <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{lowPriorityList.length}</span>
            </div>
            {lowPriorityList.map(s => <CompactStudentCard key={s.id} student={s} />)}
          </div>
        )}

        {/* EMPTY STATE */}
        {filtered.length === 0 && (
          <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
             <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
             <p className="font-medium">No students found matching your criteria.</p>
          </div>
        )}

      </div>
    </div>
  )
}

// --- COMPACT CARD COMPONENT ---
function CompactStudentCard({ student }) {
  const [isOpen, setIsOpen] = useState(false);
  const { t1, t2, overallPriority } = student;

  // Tiny Chart Data
  const chartData = [
    { name: 'T1', Grade: t1.avgGrade, Attendance: t1.attendance?.value || 100 },
    { name: 'T2', Grade: t2.avgGrade, Attendance: t2.attendance?.value || 100 },
  ];

  // Visuals
  const isHigh = overallPriority === 'High';
  const borderClass = isHigh ? 'border-l-red-500' : 'border-l-amber-500';
  
  // Trend Icon
  const getTrend = () => {
    const rank = { 'High': 0, 'Low': 1, 'Normal': 2 };
    if (rank[t2.priority] < rank[t1.priority]) return <TrendingDown size={16} className="text-red-500" />;
    if (rank[t2.priority] > rank[t1.priority]) return <TrendingUp size={16} className="text-emerald-500" />;
    return <Minus size={16} className="text-slate-300" />;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 border-l-[4px] ${borderClass} overflow-hidden hover:shadow-md transition-all`}>
      
      {/* CARD HEADER */}
      <div className="flex flex-col sm:flex-row items-center p-3 gap-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        
        {/* 1. Student Info */}
        <div className="flex-1 flex items-center gap-3 w-full">
           <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm text-white ${isHigh ? 'bg-red-500' : 'bg-amber-500'}`}>
              {student.name.charAt(0)}
           </div>
           <div>
              <h3 className="text-sm font-bold text-slate-800">{student.name}</h3>
              {/* REMOVED: High/Low Label here, as it's now redundant with the section header */}
              <span className="text-xs text-slate-500 font-mono">{student.class}</span>
           </div>
        </div>

        {/* 2. Micro Graph & Trend */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
           <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="text-[10px] uppercase tracking-wider">Trend:</span>
              {getTrend()}
           </div>

           {/* Recharts Micro Chart */}
           <div className="h-10 w-24">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData}>
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{display:'none'}} />
                    <Bar dataKey="Attendance" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Grade" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>

           <button className="text-slate-400 hover:text-slate-600">
             {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
           </button>
        </div>
      </div>

      {/* DROPDOWN DETAILS */}
      {isOpen && (
        <div className="bg-slate-50 border-t border-slate-100 p-4 grid md:grid-cols-2 gap-4 text-sm animate-in slide-in-from-top-1">
           <TermDetailCompact name="Term 1" data={t1} />
           <TermDetailCompact name="Term 2" data={t2} />
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: Compact Term Details ---
function TermDetailCompact({ name, data }) {
  if (data.priority === 'Normal') {
    return (
      <div className="border border-slate-200 rounded p-2 bg-white opacity-60 flex items-center justify-between">
         <span className="font-bold text-slate-500 text-xs uppercase">{name}</span>
         <span className="text-xs text-green-600 font-bold">✔ On Track</span>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded bg-white p-2">
       <div className="flex justify-between mb-2 pb-1 border-b border-slate-50">
          <span className="font-bold text-slate-700 text-xs uppercase">{name}</span>
          <span className={`text-[10px] font-bold px-1.5 rounded uppercase ${
             data.priority==='High'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'
          }`}>{data.priority} Risk</span>
       </div>
       
       <div className="space-y-1">
          {data.attendance && (
             <div className="flex justify-between text-xs">
                <span className="text-slate-500">Attendance</span>
                <span className={`font-mono font-bold ${data.attendance.level==='High'?'text-red-600':'text-amber-600'}`}>{data.attendance.value}%</span>
             </div>
          )}
          {data.cocu && (
             <div className="flex justify-between text-xs">
                <span className="text-slate-500">Co-Cu</span>
                <span className={`font-mono font-bold ${data.cocu.level==='High'?'text-red-600':'text-amber-600'}`}>{data.cocu.value}%</span>
             </div>
          )}
          {data.failingSubjects.map((s, i) => (
             <div key={i} className="flex justify-between text-xs">
                <span className="text-slate-500">{s.subject}</span>
                <span className={`font-mono font-bold ${s.level==='High'?'text-red-600':'text-amber-600'}`}>{s.score}%</span>
             </div>
          ))}
       </div>
    </div>
  )
}