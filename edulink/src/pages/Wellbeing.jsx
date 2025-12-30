import React, { useEffect, useState } from 'react'
import { db, ref, onValue, update } from '../firebaseRTDB'
import { useAuth } from '../context/AuthContext'
import { 
  AlertCircle, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Search, X, 
  AlertTriangle, CheckCircle, Phone, ListFilter
} from 'lucide-react'
import { 
  BarChart, Bar, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function Wellbeing() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [usersData, setUsersData] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- NEW: View State (Not Contacted Yet vs Contacted) ---
  const [viewStatus, setViewStatus] = useState('not_contacted'); // 'not_contacted' | 'contacted'

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

  // --- 1. FETCH USERS ---
  useEffect(() => {
    const unsub = onValue(ref(db, "users"), (snap) => {
      setUsersData(snap.val() || {});
    });
    return () => unsub();
  }, []);

  // --- 2. FETCH & PROCESS STUDENTS ---
  useEffect(() => {
    const unsub = onValue(ref(db, "students"), (snap) => {
      const data = snap.val();
      if (!data) { setAlerts([]); setLoading(false); return; }
      
      const allStudents = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      
      // Role Filter
      let relevantStudents = [];
      if (user.role === 'parent') relevantStudents = allStudents.filter(s => s.parentId === user.uid);
      else if (user.role === 'teacher') relevantStudents = allStudents.filter(s => s.class === user.class);
      else relevantStudents = allStudents; // Admin & Counselor

      // Analyze
      const processed = relevantStudents.map(s => {
        const t1 = analyzeTerm(s, 't1');
        const t2 = analyzeTerm(s, 't2');
        
        let overallPriority = 'Normal';
        if (t1.priority === 'High' || t2.priority === 'High') overallPriority = 'High';
        else if (t1.priority === 'Low' || t2.priority === 'Low') overallPriority = 'Low';

        // Retrieve Parent Phone
        const parent = usersData[s.parentId];
        const parentPhone = parent?.phone || "Unavailable";

        return { ...s, t1, t2, overallPriority, parentPhone };
      }).filter(s => s.overallPriority !== 'Normal');

      // Sort Alphabetical
      processed.sort((a, b) => a.name.localeCompare(b.name));
      
      setAlerts(processed);
      setLoading(false);
    });
    return () => unsub();
  }, [user, usersData]);

  // --- ACTIONS ---
  const toggleContactStatus = async (student) => {
    const newStatus = student.contactStatus === 'contacted' ? 'not_contacted' : 'contacted';
    try {
      await update(ref(db, `students/${student.id}`), {
        contactStatus: newStatus,
        lastContactedAt: newStatus === 'contacted' ? new Date().toISOString() : null
      });
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Error updating status. Please check permissions.");
    }
  };

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading Well-Being data...</div>;

  // --- FILTER LOGIC (Updated for View State) ---
  const allFilteredBySearch = alerts.filter(s => 
    !searchTerm.trim() || 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Split by Status
  const pendingStudents = allFilteredBySearch.filter(s => s.contactStatus !== 'contacted');
  const contactedStudents = allFilteredBySearch.filter(s => s.contactStatus === 'contacted');

  // Determine which list to show based on Tab
  const displayedList = viewStatus === 'not_contacted' ? pendingStudents : contactedStudents;

  // Further split by Priority (for the displayed list only)
  const highPriorityList = displayedList.filter(s => s.overallPriority === 'High');
  const lowPriorityList = displayedList.filter(s => s.overallPriority === 'Low');

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
                  {alerts.length} total cases detected
                </p>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* View Toggles */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
             <button 
               onClick={() => setViewStatus('not_contacted')}
               className={`flex-1 flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewStatus === 'not_contacted' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <ListFilter size={14} /> 
               Pending ({pendingStudents.length})
             </button>
             <button 
               onClick={() => setViewStatus('contacted')}
               className={`flex-1 flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewStatus === 'contacted' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <CheckCircle size={14} /> 
               Contacted ({contactedStudents.length})
             </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64 group">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search..." 
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
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="space-y-8 min-h-[400px]">
        
        {/* SECTION 1: HIGH PRIORITY */}
        {highPriorityList.length > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 px-1">
               <AlertTriangle size={18} className="text-red-500" />
               <h2 className="text-sm font-bold text-red-800 uppercase tracking-wider">High Priority ({viewStatus === 'contacted' ? 'Resolved' : 'Pending'})</h2>
               <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{highPriorityList.length}</span>
            </div>
            {highPriorityList.map(s => (
              <CompactStudentCard 
                key={s.id} 
                student={s} 
                userRole={user.role} 
                onToggleStatus={() => toggleContactStatus(s)} 
              />
            ))}
          </div>
        )}

        {/* SECTION 2: LOW PRIORITY */}
        {lowPriorityList.length > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="flex items-center gap-2 px-1 mt-6">
               <AlertCircle size={18} className="text-amber-500" />
               <h2 className="text-sm font-bold text-amber-800 uppercase tracking-wider">Low Priority ({viewStatus === 'contacted' ? 'Resolved' : 'Pending'})</h2>
               <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{lowPriorityList.length}</span>
            </div>
            {lowPriorityList.map(s => (
              <CompactStudentCard 
                key={s.id} 
                student={s} 
                userRole={user.role} 
                onToggleStatus={() => toggleContactStatus(s)} 
              />
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {highPriorityList.length === 0 && lowPriorityList.length === 0 && (
          <div className="p-16 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
             <div className="bg-white inline-flex p-4 rounded-full mb-4 shadow-sm">
               {viewStatus === 'not_contacted' ? (
                 <CheckCircle size={32} className="text-emerald-400" />
               ) : (
                 <ListFilter size={32} className="text-slate-300" />
               )}
             </div>
             <p className="font-medium text-slate-600">
               {viewStatus === 'not_contacted' 
                 ? "All clear! No pending cases found." 
                 : "No contacted students record found."}
             </p>
             <p className="text-xs text-slate-400 mt-1">
               Try adjusting your search or switching tabs.
             </p>
          </div>
        )}

      </div>
    </div>
  )
}

// --- COMPACT CARD COMPONENT ---
function CompactStudentCard({ student, userRole, onToggleStatus }) {
  const [isOpen, setIsOpen] = useState(false);
  const { t1, t2, overallPriority, contactStatus, parentPhone } = student;

  // Tiny Chart Data
  const chartData = [
    { name: 'T1', Grade: t1.avgGrade, Attendance: t1.attendance?.value || 100 },
    { name: 'T2', Grade: t2.avgGrade, Attendance: t2.attendance?.value || 100 },
  ];

  // Visuals
  const isHigh = overallPriority === 'High';
  const borderClass = isHigh ? 'border-l-red-500' : 'border-l-amber-500';
  const isContacted = contactStatus === 'contacted';
  
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
      <div className="flex flex-col sm:flex-row items-center p-3 gap-4">
        
        {/* 1. Student Info + Click to Open */}
        <div className="flex-1 flex items-center gap-3 w-full cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
           <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm text-white ${isHigh ? 'bg-red-500' : 'bg-amber-500'}`}>
              {student.name.charAt(0)}
           </div>
           <div>
              <h3 className="text-sm font-bold text-slate-800">{student.name}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                 <span className="text-xs text-slate-500 font-mono">{student.class}</span>
                 {userRole === 'counselor' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      <Phone size={10} /> {parentPhone}
                    </span>
                 )}
              </div>
           </div>
        </div>

        {/* 2. Counselor Actions & Micro Graph */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
           
           {/* COUNSELOR CONTACT BUTTON */}
           {userRole === 'counselor' && (
             <button 
               onClick={(e) => { e.stopPropagation(); onToggleStatus(); }}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border ${
                 isContacted 
                   ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                   : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600'
               }`}
             >
               {isContacted ? (
                 <>
                   <CheckCircle size={14} className="text-emerald-500" />
                   Done
                 </>
               ) : (
                 <>
                   <Phone size={14} className={isHigh ? "text-red-500" : "text-amber-500"} />
                   Contact
                 </>
               )}
             </button>
           )}

           {/* Trend Info */}
           <div className="flex items-center gap-2 text-xs font-medium text-slate-500 hidden md:flex">
              <span className="text-[10px] uppercase tracking-wider">Trend:</span>
              {getTrend()}
           </div>

           {/* Micro Chart */}
           <div className="h-10 w-24 hidden sm:block">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData}>
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{display:'none'}} />
                    <Bar dataKey="Attendance" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Grade" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>

           <button onClick={() => setIsOpen(!isOpen)} className="text-slate-400 hover:text-slate-600">
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