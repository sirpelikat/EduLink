import React, { useEffect, useState } from 'react'
import { db, ref, onValue } from '../firebaseRTDB'
import { useAuth } from '../context/AuthContext'

export default function Wellbeing() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- HELPER: Identify Issues per Term ---
  const getTermIssues = (student, termPrefix) => {
    const issues = {
      hasIssues: false,
      attendance: null,
      cocu: null,
      failingSubjects: []
    };

    // 1. Check Attendance (< 85%)
    const attKey = `${termPrefix}_attendance`;
    const cocuKey = `${termPrefix}_cocu_attendance`;

    if (student[attKey] !== undefined && Number(student[attKey]) < 85) {
      issues.attendance = student[attKey];
      issues.hasIssues = true;
    }
    if (student[cocuKey] !== undefined && Number(student[cocuKey]) < 85) {
      issues.cocu = student[cocuKey];
      issues.hasIssues = true;
    }

    // 2. Check Subjects (< 50%)
    const subjects = {
      'subj_bm': 'Bahasa Melayu',
      'subj_english': 'English',
      'subj_math': 'Mathematics',
      'subj_science': 'Science'
    };

    Object.entries(subjects).forEach(([key, label]) => {
      const dbKey = `${termPrefix}_${key}`;
      if (student[dbKey] !== undefined && Number(student[dbKey]) < 50) {
        issues.failingSubjects.push({ subject: label, score: student[dbKey] });
        issues.hasIssues = true;
      }
    });

    return issues.hasIssues ? issues : null;
  };

  useEffect(() => {
    const unsub = onValue(ref(db, "students"), (snap) => {
      const data = snap.val();
      if (!data) { setAlerts([]); setLoading(false); return; }
      
      const allStudents = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      
      // Filter logic based on Role
      let relevantStudents = [];
      if (user.role === 'parent') {
        relevantStudents = allStudents.filter(s => s.parentId === user.uid);
      } else if (user.role === 'teacher') {
        relevantStudents = allStudents.filter(s => s.class === user.class);
      } else {
        relevantStudents = allStudents; // Admin
      }

      // Filter for "At Risk" in EITHER Term 1 OR Term 2
      const atRisk = relevantStudents.filter(s => {
        const t1 = getTermIssues(s, 't1');
        const t2 = getTermIssues(s, 't2');
        return t1 || t2;
      });
      
      setAlerts(atRisk);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  if (loading) return <div className="p-6">Checking wellbeing stats...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Well-being Report</h1>
        <p className="text-slate-500">
          Automated detection of students requiring attention based on academic and attendance patterns per term.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {alerts.length === 0 ? (
          <div className="col-span-3 bg-green-50 p-8 rounded-xl text-center border border-green-200 text-green-800">
            <span className="text-4xl block mb-2">😊</span>
            <h3 className="font-bold text-lg">All Clear!</h3>
            <p>No students in your list currently meet the risk criteria.</p>
          </div>
        ) : (
          alerts.map(s => {
            const t1Issues = getTermIssues(s, 't1');
            const t2Issues = getTermIssues(s, 't2');

            return (
              <div key={s.id} className="bg-white p-6 rounded-xl shadow-sm border-l-8 border-red-500 flex flex-col gap-4">
                <div className="border-b border-slate-50 pb-2">
                  <h3 className="text-xl font-bold text-slate-800">{s.name}</h3>
                  <p className="text-sm text-gray-500">{s.class}</p>
                </div>
                
                {/* --- TERM 1 REPORT --- */}
                {t1Issues && (
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Term 1 Issues</h4>
                    
                    {/* Attendance T1 */}
                    {(t1Issues.attendance || t1Issues.cocu) && (
                       <div className="mb-3">
                         <p className="text-[10px] font-bold text-red-600 mb-1">⚠️ ATTENDANCE</p>
                         {t1Issues.attendance && (
                           <div className="flex justify-between text-sm mb-1">
                             <span className="text-slate-600">Class</span>
                             <span className="font-bold text-red-600">{t1Issues.attendance}%</span>
                           </div>
                         )}
                         {t1Issues.cocu && (
                           <div className="flex justify-between text-sm">
                             <span className="text-slate-600">Co-Curriculum</span>
                             <span className="font-bold text-red-600">{t1Issues.cocu}%</span>
                           </div>
                         )}
                       </div>
                    )}

                    {/* Academics T1 */}
                    {t1Issues.failingSubjects.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-orange-600 mb-1">📚 ACADEMIC (FAILING)</p>
                        <ul className="space-y-1">
                          {t1Issues.failingSubjects.map((sub, idx) => (
                            <li key={idx} className="flex justify-between text-sm">
                              <span className="text-slate-600">{sub.subject}</span>
                              <span className="font-bold text-orange-600">{sub.score}%</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* --- TERM 2 REPORT --- */}
                {t2Issues && (
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Term 2 Issues</h4>
                    
                    {/* Attendance T2 */}
                    {(t2Issues.attendance || t2Issues.cocu) && (
                       <div className="mb-3">
                         <p className="text-[10px] font-bold text-red-600 mb-1">⚠️ ATTENDANCE</p>
                         {t2Issues.attendance && (
                           <div className="flex justify-between text-sm mb-1">
                             <span className="text-slate-600">Class</span>
                             <span className="font-bold text-red-600">{t2Issues.attendance}%</span>
                           </div>
                         )}
                         {t2Issues.cocu && (
                           <div className="flex justify-between text-sm">
                             <span className="text-slate-600">Co-Curriculum</span>
                             <span className="font-bold text-red-600">{t2Issues.cocu}%</span>
                           </div>
                         )}
                       </div>
                    )}

                    {/* Academics T2 */}
                    {t2Issues.failingSubjects.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-orange-600 mb-1">📚 ACADEMIC (FAILING)</p>
                        <ul className="space-y-1">
                          {t2Issues.failingSubjects.map((sub, idx) => (
                            <li key={idx} className="flex justify-between text-sm">
                              <span className="text-slate-600">{sub.subject}</span>
                              <span className="font-bold text-orange-600">{sub.score}%</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-auto pt-2 text-xs text-gray-400 text-center">
                  Auto-detected by EduLink Algorithm
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  )
}