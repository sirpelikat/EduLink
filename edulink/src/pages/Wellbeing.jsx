import React, { useEffect, useState } from 'react'
import { db, ref, onValue, update } from '../firebaseRTDB'
import { useAuth } from '../context/AuthContext'
import { 
  AlertCircle, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Search, X, 
  AlertTriangle, CheckCircle, Phone, ListFilter, CheckSquare, Square, Clock
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
  
  // View State: 'not_contacted' (Pending) or 'contacted' (History/Active)
  const [viewStatus, setViewStatus] = useState('not_contacted');

  // --- HELPER: Analyze Single Term ---
  const analyzeTerm = (student, termPrefix) => {
    const issues = {
      attendance: null,
      cocu: null,
      failingSubjects: [],
      priority: 'Normal', 
      avgGrade: 0
    };

    const att = Number(student[`${termPrefix}_attendance`] || 100);
    const cocu = Number(student[`${termPrefix}_cocu_attendance`] || 100);
    
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
    const unsub = onValue(ref(db, "users"), (snap) => setUsersData(snap.val() || {}));
    return () => unsub();
  }, []);

  // --- 2. FETCH & PROCESS STUDENTS ---
  useEffect(() => {
    const unsub = onValue(ref(db, "students"), (snap) => {
      const data = snap.val();
      if (!data) { setAlerts([]); setLoading(false); return; }
      
      const allStudents = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      
      let relevantStudents = [];
      if (user.role === 'parent') relevantStudents = allStudents.filter(s => s.parentId === user.uid);
      else if (user.role === 'teacher') relevantStudents = allStudents.filter(s => s.class === user.class);
      else relevantStudents = allStudents; 

      const processed = relevantStudents.map(s => {
        const t1 = analyzeTerm(s, 't1');
        const t2 = analyzeTerm(s, 't2');
        
        let overallPriority = 'Normal';
        if (t1.priority === 'High' || t2.priority === 'High') overallPriority = 'High';
        else if (t1.priority === 'Low' || t2.priority === 'Low') overallPriority = 'Low';

        const parent = usersData[s.parentId];
        const parentPhone = parent?.phone || "Unavailable";
        
        // Ensure caseStatus exists
        const caseStatus = s.caseStatus || 'Unresolved'; 

        return { ...s, t1, t2, overallPriority, parentPhone, caseStatus };
      }).filter(s => s.overallPriority !== 'Normal');

      processed.sort((a, b) => a.name.localeCompare(b.name));
      
      setAlerts(processed);
      setLoading(false);
    });
    return () => unsub();
  }, [user, usersData]);

  // --- ACTIONS ---
  
  // 1. Move from Pending -> Contacted (Reset case to Unresolved if needed)
  const markAsContacted = async (student) => {
    try {
      await update(ref(db, `students/${student.id}`), {
        contactStatus: 'contacted',
        lastContactedAt: new Date().toISOString(),
        caseStatus: 'Unresolved' 
      });
    } catch (error) { alert("Error updating status."); }
  };

  // 2. Toggle Case Resolution (Resolved <-> Unresolved)
  const toggleResolution = async (student) => {
    const newResolution = student.caseStatus === 'Resolved' ? 'Unresolved' : 'Resolved';
    try {
      await update(ref(db, `students/${student.id}`), {
        caseStatus: newResolution
      });
    } catch (error) { alert("Error updating resolution."); }
  };

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading Well-Being data...</div>;

  // --- FILTER LOGIC ---
  const allFiltered = alerts.filter(s => 
    !searchTerm.trim() || 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingList = allFiltered.filter(s => s.contactStatus !== 'contacted');
  const contactedList = allFiltered.filter(s => s.contactStatus === 'contacted');

  // Split Contacted List into Resolved vs Unresolved
  const unresolvedList = contactedList.filter(s => s.caseStatus !== 'Resolved');
  const resolvedList = contactedList.filter(s => s.caseStatus === 'Resolved');

  return (
    <div className="p-4 w-full mx-auto">
      
      {/* HEADER & CONTROLS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-2 z-20">
        <div className="flex items-center gap-3">
            <div className="bg-red-50 p-2 rounded-lg text-red-600">
               <AlertCircle size={24} />
            </div>
            <div>
                <h1 className="text-xl font-bold text-slate-800 leading-tight">Well-Being Monitor</h1>
                <p className="text-xs text-slate-500 font-medium">
                  {pendingList.length} pending, {contactedList.length} contacted
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
               Pending ({pendingList.length})
             </button>
             <button 
               onClick={() => setViewStatus('contacted')}
               className={`flex-1 flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewStatus === 'contacted' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <CheckCircle size={14} /> 
               Contacted ({contactedList.length})
             </button>
          </div>

          <div className="relative w-full sm:w-64 group">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" placeholder="Search..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"><X size={14} /></button>
              )}
          </div>
        </div>
      </div>

      <div className="space-y-8 min-h-[400px]">
        
        {/* VIEW 1: PENDING CONTACT (High/Low Priority) */}
        {viewStatus === 'not_contacted' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             {pendingList.length === 0 ? (
               <EmptyState msg="No pending cases found." icon={CheckCircle} />
             ) : (
               <>
                 {/* High Priority */}
                 {pendingList.some(s => s.overallPriority === 'High') && (
                   <div className="mb-6">
                     <div className="flex items-center gap-2 px-1 mb-3">
                        <AlertTriangle size={18} className="text-red-500" />
                        <h2 className="text-sm font-bold text-red-800 uppercase tracking-wider">High Priority Pending</h2>
                        <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          {pendingList.filter(s => s.overallPriority === 'High').length}
                        </span>
                     </div>
                     <div className="space-y-3">
                       {pendingList.filter(s => s.overallPriority === 'High').map(s => (
                         <CompactStudentCard 
                            key={s.id} student={s} userRole={user.role} 
                            onAction={() => markAsContacted(s)} 
                            actionLabel="Contact"
                            actionIcon={Phone}
                            actionColor="blue"
                         />
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Low Priority */}
                 {pendingList.some(s => s.overallPriority === 'Low') && (
                   <div>
                     <div className="flex items-center gap-2 px-1 mb-3">
                        <AlertCircle size={18} className="text-amber-500" />
                        <h2 className="text-sm font-bold text-amber-800 uppercase tracking-wider">Low Priority Pending</h2>
                        <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          {pendingList.filter(s => s.overallPriority === 'Low').length}
                        </span>
                     </div>
                     <div className="space-y-3">
                       {pendingList.filter(s => s.overallPriority === 'Low').map(s => (
                         <CompactStudentCard 
                            key={s.id} student={s} userRole={user.role} 
                            onAction={() => markAsContacted(s)} 
                            actionLabel="Contact"
                            actionIcon={Phone}
                            actionColor="blue"
                         />
                       ))}
                     </div>
                   </div>
                 )}
               </>
             )}
          </div>
        )}

        {/* VIEW 2: CONTACTED (Unresolved vs Resolved) */}
        {viewStatus === 'contacted' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
             
             {/* SECTION A: UNRESOLVED CASES */}
             <div>
                <div className="flex items-center gap-2 px-1 mb-3 border-b border-blue-100 pb-2">
                   <Clock size={18} className="text-blue-500" />
                   <h2 className="text-sm font-bold text-blue-800 uppercase tracking-wider">Unresolved / Ongoing Cases</h2>
                   <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{unresolvedList.length}</span>
                </div>
                
                {unresolvedList.length === 0 ? (
                  <div className="text-sm text-slate-400 italic px-2">No ongoing cases.</div>
                ) : (
                  <div className="space-y-3">
                    {unresolvedList.map(s => (
                      <CompactStudentCard 
                        key={s.id} student={s} userRole={user.role} 
                        onAction={() => toggleResolution(s)} 
                        actionLabel="Resolve"
                        actionIcon={CheckCircle}
                        actionColor="emerald"
                        isContactedView={true}
                      />
                    ))}
                  </div>
                )}
             </div>

             {/* SECTION B: RESOLVED CASES */}
             <div className="opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 px-1 mb-3 border-b border-slate-200 pb-2">
                   <CheckCircle size={18} className="text-emerald-600" />
                   <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Resolved Cases</h2>
                   <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{resolvedList.length}</span>
                </div>
                
                {resolvedList.length === 0 ? (
                  <div className="text-sm text-slate-400 italic px-2">No resolved cases yet.</div>
                ) : (
                  <div className="space-y-3">
                    {resolvedList.map(s => (
                      <CompactStudentCard 
                        key={s.id} student={s} userRole={user.role} 
                        onAction={() => toggleResolution(s)}
                        actionLabel="Reopen"
                        actionIcon={Minus}
                        actionColor="slate"
                        isContactedView={true}
                      />
                    ))}
                  </div>
                )}
             </div>

          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ msg, icon: Icon }) {
  return (
    <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
       <Icon size={32} className="mx-auto mb-2 opacity-50" />
       <p className="font-medium">{msg}</p>
    </div>
  );
}

// --- CARD COMPONENT ---
function CompactStudentCard({ student, userRole, onAction, actionLabel, actionIcon: ActionIcon, actionColor, isContactedView }) {
  const [isOpen, setIsOpen] = useState(false);
  const { t1, t2, overallPriority, parentPhone, caseStatus } = student;

  const isHigh = overallPriority === 'High';
  const isResolved = caseStatus === 'Resolved';
  
  // Dynamic Styling based on Resolved status
  const borderClass = isResolved 
    ? 'border-l-emerald-500 bg-emerald-50/30' 
    : (isHigh ? 'border-l-red-500' : 'border-l-amber-500');

  const chartData = [
    { name: 'T1', Grade: t1.avgGrade, Attendance: t1.attendance?.value || 100 },
    { name: 'T2', Grade: t2.avgGrade, Attendance: t2.attendance?.value || 100 },
  ];

  // Helper for button colors
  const btnStyles = {
    blue: "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-300",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300",
    slate: "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 border-l-[4px] ${borderClass} overflow-hidden hover:shadow-md transition-all`}>
      <div className="flex flex-col sm:flex-row items-center p-3 gap-4">
        
        {/* STUDENT INFO */}
        <div className="flex-1 flex items-center gap-3 w-full cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
           <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm text-white ${isResolved ? 'bg-emerald-500' : (isHigh ? 'bg-red-500' : 'bg-amber-500')}`}>
              {student.name.charAt(0)}
           </div>
           <div>
              <div className="flex items-center gap-2">
                 <h3 className={`text-sm font-bold ${isResolved ? 'text-emerald-800' : 'text-slate-800'}`}>{student.name}</h3>
                 {isResolved && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 rounded uppercase">Resolved</span>}
              </div>
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

        {/* ACTIONS */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
           
           {userRole === 'counselor' && (
             <div className="flex items-center gap-2">
               {/* Unified Action Button */}
               <button 
                 onClick={(e) => { e.stopPropagation(); onAction(); }}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border ${btnStyles[actionColor]}`}
               >
                 <ActionIcon size={14} /> {actionLabel}
               </button>
             </div>
           )}

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
           
           <button onClick={() => setIsOpen(!isOpen)} className="text-slate-400 hover:text-slate-600"><ChevronDown size={18} /></button>
        </div>
      </div>

      {isOpen && (
        <div className="bg-slate-50 border-t border-slate-100 p-4 grid md:grid-cols-2 gap-4 text-sm">
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
          <span className={`text-[10px] font-bold px-1.5 rounded uppercase ${data.priority==='High'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{data.priority} Risk</span>
       </div>
       <div className="space-y-1">
          {data.attendance && <div className="flex justify-between text-xs"><span className="text-slate-500">Attendance</span><span className={`font-mono font-bold ${data.attendance.level==='High'?'text-red-600':'text-amber-600'}`}>{data.attendance.value}%</span></div>}
          {data.cocu && <div className="flex justify-between text-xs"><span className="text-slate-500">Co-Cu</span><span className={`font-mono font-bold ${data.cocu.level==='High'?'text-red-600':'text-amber-600'}`}>{data.cocu.value}%</span></div>}
          {data.failingSubjects.map((s, i) => <div key={i} className="flex justify-between text-xs"><span className="text-slate-500">{s.subject}</span><span className={`font-mono font-bold ${s.level==='High'?'text-red-600':'text-amber-600'}`}>{s.score}%</span></div>)}
       </div>
    </div>
  )
}