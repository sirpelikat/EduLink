import React, { useEffect, useState } from 'react'
import { db, ref, onValue } from '../firebaseRTDB'
import { useAuth } from '../context/AuthContext'

export default function Wellbeing() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

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
      // Criteria: Attendance < 85 OR Grade < 50 OR Behavior < 70
      const atRisk = relevantStudents.filter(s => 
        s.attendance < 85 || s.grade < 50 || (s.behaviorScore && s.behaviorScore < 70)
      );
      
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
          Automated detection of students requiring attention based on academic and behavioral patterns.
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
          alerts.map(s => (
            <div key={s.id} className="bg-white p-6 rounded-xl shadow-sm border-l-8 border-red-500 flex flex-col">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-800">{s.name}</h3>
                <p className="text-sm text-gray-500">{s.class}</p>
              </div>
              
              <div className="space-y-3 mb-6">
                {s.attendance < 85 && (
                  <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-sm font-semibold flex justify-between">
                    <span>Low Attendance</span>
                    <span>{s.attendance}%</span>
                  </div>
                )}
                {s.grade < 50 && (
                  <div className="bg-orange-50 text-orange-700 px-3 py-2 rounded text-sm font-semibold flex justify-between">
                    <span>Low Grades</span>
                    <span>{s.grade}%</span>
                  </div>
                )}
                {s.behaviorScore < 70 && (
                  <div className="bg-yellow-50 text-yellow-700 px-3 py-2 rounded text-sm font-semibold flex justify-between">
                    <span>Behavior Flag</span>
                    <span>{s.behaviorScore}/100</span>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4 border-t text-xs text-gray-400">
                Auto-detected by EduLink Algorithm
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}