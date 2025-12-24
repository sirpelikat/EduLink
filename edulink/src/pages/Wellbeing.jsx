import React, { useEffect, useState } from 'react'
import { db, ref, onValue } from '../firebaseRTDB'
import { useAuth } from '../context/AuthContext'

export default function Wellbeing() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to identify failing subjects across terms
  const getFailingSubjects = (student) => {
    const failing = [];
    const subjects = {
      'subj_bm': 'Bahasa Melayu',
      'subj_english': 'English',
      'subj_math': 'Mathematics',
      'subj_science': 'Science'
    };
    
    ['t1', 't2'].forEach(term => {
      Object.entries(subjects).forEach(([key, label]) => {
        const dbKey = `${term}_${key}`;
        if (student[dbKey] && Number(student[dbKey]) < 50) {
          failing.push({
            id: dbKey,
            term: term === 't1' ? 'Term 1' : 'Term 2',
            subject: label,
            score: student[dbKey]
          });
        }
      });
    });
    return failing;
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

      // Filter for "At Risk"
      // New Criteria: 
      // 1. Class Attendance < 85 OR CoCu Attendance < 85
      // 2. Any subject grade < 50 (Failing)
      const atRisk = relevantStudents.filter(s => {
        const poorAttendance = (s.attendance && s.attendance < 85) || (s.cocu_attendance && s.cocu_attendance < 85);
        
        const failingSubjects = getFailingSubjects(s);
        const hasFailingGrades = failingSubjects.length > 0 || (s.grade && s.grade < 50);

        return poorAttendance || hasFailingGrades;
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
          Automated detection of students requiring attention based on detailed academic and attendance patterns.
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
            const failingList = getFailingSubjects(s);
            const isAttendanceRisk = (s.attendance && s.attendance < 85) || (s.cocu_attendance && s.cocu_attendance < 85);
            
            return (
              <div key={s.id} className="bg-white p-6 rounded-xl shadow-sm border-l-8 border-red-500 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-800">{s.name}</h3>
                  <p className="text-sm text-gray-500">{s.class}</p>
                </div>
                
                <div className="space-y-4 mb-6">
                  {/* ATTENDANCE SECTION */}
                  {isAttendanceRisk && (
                    <div className="bg-red-50 text-red-800 p-3 rounded-lg border border-red-100">
                      <p className="text-xs font-bold uppercase tracking-wider mb-2 text-red-600 flex items-center gap-1">
                        ⚠️ Attendance Alerts
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className={s.attendance < 85 ? "font-bold" : "text-gray-600"}>Classroom</span>
                          <span className={`font-mono ${s.attendance < 85 ? "text-red-600 font-bold" : "text-gray-600"}`}>
                            {s.attendance || 0}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className={s.cocu_attendance < 85 ? "font-bold" : "text-gray-600"}>Co-Curriculum</span>
                          <span className={`font-mono ${s.cocu_attendance < 85 ? "text-red-600 font-bold" : "text-gray-600"}`}>
                            {s.cocu_attendance || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GRADES SECTION */}
                  {(failingList.length > 0 || (s.grade && s.grade < 50)) && (
                    <div className="bg-orange-50 text-orange-800 p-3 rounded-lg border border-orange-100">
                      <p className="text-xs font-bold uppercase tracking-wider mb-2 text-orange-600 flex items-center gap-1">
                        📚 Academic Concerns
                      </p>
                      
                      {failingList.length > 0 ? (
                        <ul className="space-y-1">
                          {failingList.map((fail) => (
                            <li key={fail.id} className="flex justify-between text-sm">
                              <span>{fail.subject} <span className="text-[10px] text-orange-400">({fail.term})</span></span>
                              <span className="font-mono font-bold text-orange-700">{fail.score}%</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="flex justify-between text-sm">
                          <span>Overall Grade</span>
                          <span className="font-mono font-bold text-orange-700">{s.grade}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-4 border-t text-xs text-gray-400">
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