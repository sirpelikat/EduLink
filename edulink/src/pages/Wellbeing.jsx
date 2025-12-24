import React, { useEffect, useState } from 'react'
import { db, ref, onValue } from '../firebaseRTDB'
import { useAuth } from '../context/AuthContext'
import { 
  AlertCircle, Calendar, BookOpen, Clock, User, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus 
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid 
} from 'recharts';

export default function Wellbeing() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- HELPER: Calculate Priority & Issues for a Single Term ---
  const analyzeTerm = (student, termPrefix) => {
    const issues = {
      attendance: null,
      cocu: null,
      failingSubjects: [],
      priority: 'Normal', // Normal, Low, High
      avgGrade: 0
    };

    // 1. Get Data
    const att = Number(student[`${termPrefix}_attendance`] || 100);
    const cocu = Number(student[`${termPrefix}_cocu_attendance`] || 100);
    
    // Calculate Subject Averages & Identify Failures
    const subjects = {
      'subj_bm': 'Bahasa Melayu',
      'subj_english': 'English',
      'subj_math': 'Mathematics',
      'subj_science': 'Science'
    };
    
    let totalScore = 0;
    let count = 0;

    Object.entries(subjects).forEach(([key, label]) => {
      const val = student[`${termPrefix}_${key}`];
      if (val !== undefined) {
        const score = Number(val);
        totalScore += score;
        count++;

        // Determine specific subject priority
        if (score < 50) issues.failingSubjects.push({ subject: label, score, level: 'High' });
        else if (score < 80) issues.failingSubjects.push({ subject: label, score, level: 'Low' });
      }
    });

    issues.avgGrade = count > 0 ? Math.round(totalScore / count) : 0;
    
    // 2. Determine Priority Level
    // HIGH PRIORITY CRITERIA (< 50%)
    const isHigh = att < 50 || cocu < 50 || issues.failingSubjects.some(s => s.score < 50);
    
    // LOW PRIORITY CRITERIA (< 80%)
    const isLow = !isHigh && (att < 80 || cocu < 80 || issues.failingSubjects.some(s => s.score < 80));

    if (isHigh) issues.priority = 'High';
    else if (isLow) issues.priority = 'Low';

    // Store raw values for reporting if they are issues
    if (att < 80) issues.attendance = { value: att, level: att < 50 ? 'High' : 'Low' };
    if (cocu < 80) issues.cocu = { value: cocu, level: cocu < 50 ? 'High' : 'Low' };

    return issues;
  };

  useEffect(() => {
    const unsub = onValue(ref(db, "students"), (snap) => {
      const data = snap.val();
      if (!data) { setAlerts([]); setLoading(false); return; }
      
      const allStudents = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      
      // 1. Filter by Role
      let relevantStudents = [];
      if (user.role === 'parent') {
        relevantStudents = allStudents.filter(s => s.parentId === user.uid);
      } else if (user.role === 'teacher') {
        relevantStudents = allStudents.filter(s => s.class === user.class);
      } else {
        relevantStudents = allStudents; // Admin
      }

      // 2. Analyze & Sort
      const processed = relevantStudents.map(s => {
        const t1 = analyzeTerm(s, 't1');
        const t2 = analyzeTerm(s, 't2');
        
        // Determine Overall Max Priority (High > Low > Normal)
        let overallPriority = 'Normal';
        if (t1.priority === 'High' || t2.priority === 'High') overallPriority = 'High';
        else if (t1.priority === 'Low' || t2.priority === 'Low') overallPriority = 'Low';

        return { ...s, t1, t2, overallPriority };
      }).filter(s => s.overallPriority !== 'Normal'); // Only show students with issues

      // 3. Sorting Logic: High First, then Low. Alphabetical inside.
      processed.sort((a, b) => {
        const priorityRank = { 'High': 2, 'Low': 1, 'Normal': 0 };
        const rankDiff = priorityRank[b.overallPriority] - priorityRank[a.overallPriority];
        if (rankDiff !== 0) return rankDiff;
        return a.name.localeCompare(b.name);
      });
      
      setAlerts(processed);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  if (loading) return <div className="p-6">Checking wellbeing stats...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center gap-4 border-b border-slate-200 pb-6">
        <div className="bg-slate-800 p-3 rounded-xl text-white shadow-lg">
           <AlertCircle size={32} />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-slate-800">Intervention Monitor</h1>
            <p className="text-slate-500">
             Priority-based screening for academic and attendance risks.
            </p>
        </div>
      </div>
      
      <div className="space-y-6">
        {alerts.length === 0 ? (
          <div className="bg-green-50 p-12 rounded-2xl text-center border border-green-200 text-green-800">
            <span className="text-6xl block mb-4">🎉</span>
            <h3 className="font-bold text-2xl mb-2">Excellent Status</h3>
            <p className="text-green-700">No students currently meet the risk criteria.</p>
          </div>
        ) : (
          alerts.map(s => <StudentRiskCard key={s.id} student={s} />)
        )}
      </div>
    </div>
  )
}

// --- STUDENT CARD COMPONENT ---
function StudentRiskCard({ student }) {
  const [isOpen, setIsOpen] = useState(false);
  const { t1, t2, overallPriority } = student;

  // Chart Data
  const chartData = [
    { name: 'Term 1', Grade: t1.avgGrade, Attendance: t1.attendance?.value || 100 },
    { name: 'Term 2', Grade: t2.avgGrade, Attendance: t2.attendance?.value || 100 },
  ];

  // Priority Change Logic
  const getTrendIcon = () => {
    const rank = { 'High': 0, 'Low': 1, 'Normal': 2 }; // Lower number = Worse
    if (rank[t2.priority] < rank[t1.priority]) return <TrendingDown className="text-red-500" />; // Got worse
    if (rank[t2.priority] > rank[t1.priority]) return <TrendingUp className="text-emerald-500" />; // Improved
    return <Minus className="text-slate-400" />; // Same
  };

  const priorityColor = overallPriority === 'High' 
    ? 'border-l-red-500 shadow-red-100' 
    : 'border-l-amber-500 shadow-amber-100';

  const badgeColor = overallPriority === 'High' 
    ? 'bg-red-100 text-red-700 border-red-200' 
    : 'bg-amber-100 text-amber-700 border-amber-200';

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 border-l-[6px] ${priorityColor} overflow-hidden transition-all hover:shadow-md`}>
      
      {/* 1. Header & Summary Graph */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
           <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-xl">
                 {student.name.charAt(0)}
              </div>
              <div>
                 <h3 className="font-bold text-xl text-slate-800">{student.name}</h3>
                 <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{student.class}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${badgeColor}`}>
                       {overallPriority} Priority
                    </span>
                 </div>
              </div>
           </div>

           {/* Trend Summary */}
           <div className="flex items-center gap-6 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
              <div className="text-center">
                 <p className="text-[10px] uppercase text-slate-400 font-bold">Trend (T1→T2)</p>
                 <div className="flex justify-center mt-1">{getTrendIcon()}</div>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div className="text-center">
                 <p className="text-[10px] uppercase text-slate-400 font-bold">Current Risk</p>
                 <p className="font-bold text-slate-700">{t2.priority}</p>
              </div>
           </div>
        </div>

        {/* 2. Visual Comparison Graph */}
        <div className="h-40 w-full mt-4 bg-slate-50 rounded-xl border border-slate-100 p-2">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" width={50} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{fontSize: '12px', borderRadius: '8px'}} />
                  <Legend iconSize={8} wrapperStyle={{fontSize: '10px'}} />
                  <Bar dataKey="Attendance" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={12} />
                  <Bar dataKey="Grade" fill="#F59E0B" radius={[0, 4, 4, 0]} barSize={12} name="Avg Grade" />
               </BarChart>
            </ResponsiveContainer>
        </div>

        {/* 3. Dropdown Trigger */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full mt-6 flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition py-2 border-t border-slate-100"
        >
          {isOpen ? (
             <>Hide Detailed Report <ChevronUp size={16}/></>
          ) : (
             <>View Detailed Issues <ChevronDown size={16}/></>
          )}
        </button>
      </div>

      {/* 4. Collapsible Details */}
      {isOpen && (
        <div className="bg-slate-50 border-t border-slate-200 p-6 grid md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-200">
           <TermDetails termName="Term 1" data={t1} />
           <TermDetails termName="Term 2" data={t2} />
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: Term Details ---
function TermDetails({ termName, data }) {
  const isHealthy = data.priority === 'Normal';

  return (
    <div className={`rounded-xl border p-4 ${isHealthy ? 'bg-white border-slate-200 opacity-75' : 'bg-white border-red-100 shadow-sm'}`}>
       <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-slate-700 flex items-center gap-2">
             <Calendar size={14} className="text-slate-400"/> {termName}
          </h4>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
             data.priority === 'High' ? 'bg-red-100 text-red-700' : 
             data.priority === 'Low' ? 'bg-amber-100 text-amber-700' : 
             'bg-slate-100 text-slate-500'
          }`}>
             {data.priority} Risk
          </span>
       </div>

       {isHealthy ? (
         <div className="text-center py-6 text-slate-400 text-xs italic">
            No significant issues detected in this term.
         </div>
       ) : (
         <div className="space-y-3">
            {/* Attendance Issues */}
            {(data.attendance || data.cocu) && (
               <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Attendance Alerts</p>
                  {data.attendance && (
                    <IssueRow label="Class" val={data.attendance.value} level={data.attendance.level} />
                  )}
                  {data.cocu && (
                    <IssueRow label="Co-Curriculum" val={data.cocu.value} level={data.cocu.level} />
                  )}
               </div>
            )}

            {/* Academic Issues */}
            {data.failingSubjects.length > 0 && (
               <div className="space-y-1 mt-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Academic Alerts</p>
                  {data.failingSubjects.map((sub, idx) => (
                     <IssueRow key={idx} label={sub.subject} val={sub.score} level={sub.level} />
                  ))}
               </div>
            )}
         </div>
       )}
    </div>
  )
}

function IssueRow({ label, val, level }) {
  const colorClass = level === 'High' ? 'text-red-600' : 'text-amber-600';
  return (
    <div className="flex justify-between items-center text-sm bg-slate-50 px-2 py-1.5 rounded">
       <span className="text-slate-600 font-medium">{label}</span>
       <span className={`font-bold ${colorClass}`}>{val}%</span>
    </div>
  )
}