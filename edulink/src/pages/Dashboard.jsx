import React, { useEffect, useState } from "react";
import { db, ref, onValue } from "../firebaseRTDB";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to ALL students (Filtering happens below based on role)
    // Note: For large apps, use Firebase 'query' constraints instead of client-side filtering.
    const studentsRef = ref(db, "students");
    const unsub = onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStudents(Object.entries(data).map(([id, value]) => ({ id, ...value })));
      } else {
        setStudents([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="p-6">Loading dashboard...</div>;
  if (!user) return <div className="p-6">Please sign in.</div>;

  // --- FILTER DATA BASED ON ROLE ---
  let myStudents = [];
  let dashboardTitle = "";

  if (user.role === 'parent') {
    // PARENT: Only show linked children
    myStudents = students.filter(s => s.parentId === user.uid);
    dashboardTitle = "My Children";
  } 
  else if (user.role === 'teacher') {
    // TEACHER: Show students in their assigned class
    // If teacher has no class assigned, show empty or all (depending on policy). 
    // Here we assume they must have a class.
    if (user.class) {
      myStudents = students.filter(s => s.class === user.class);
      dashboardTitle = `Class ${user.class} Dashboard`;
    } else {
      dashboardTitle = "Teacher Dashboard (No Class Assigned)";
    }
  } 
  else if (user.role === 'admin') {
    // ADMIN: Show everyone
    myStudents = students;
    dashboardTitle = "School Admin Overview";
  }

  // --- CALCULATE STATS ---
  const lowAttendance = myStudents.filter(s => s.attendance < 80);
  const failingGrades = myStudents.filter(s => s.grade < 50);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{dashboardTitle}</h1>
          <p className="text-slate-500">Welcome, {user.name || user.email}</p>
        </div>
        {user.role === 'teacher' && (
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
            Class: {user.class || 'Unassigned'}
          </span>
        )}
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm font-bold uppercase">Total Students</h3>
          <p className="text-2xl font-bold">{myStudents.length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-yellow-500">
          <h3 className="text-gray-500 text-sm font-bold uppercase">Low Attendance</h3>
          <p className="text-2xl font-bold text-yellow-600">{lowAttendance.length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-red-500">
          <h3 className="text-gray-500 text-sm font-bold uppercase">At Risk (Grades)</h3>
          <p className="text-2xl font-bold text-red-600">{failingGrades.length}</p>
        </div>
      </div>

      {/* STUDENT LIST */}
      <div className="bg-white rounded shadow overflow-hidden">
        <h2 className="bg-gray-50 px-6 py-4 border-b font-semibold text-gray-700">
          Student List
        </h2>
        {myStudents.length === 0 ? (
          <p className="p-6 text-gray-500">No students found linked to your account.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-sm uppercase">
                  <th className="px-6 py-3 border-b">Name</th>
                  <th className="px-6 py-3 border-b">Class</th>
                  <th className="px-6 py-3 border-b">Attendance</th>
                  <th className="px-6 py-3 border-b">Current Grade</th>
                  <th className="px-6 py-3 border-b">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {myStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 border-b last:border-0">
                    <td className="px-6 py-4 font-medium">{s.name}</td>
                    <td className="px-6 py-4">{s.class}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        s.attendance >= 90 ? 'bg-green-100 text-green-800' :
                        s.attendance >= 80 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {s.attendance}%
                      </span>
                    </td>
                    <td className="px-6 py-4">{s.grade}%</td>
                    <td className="px-6 py-4">
                      {s.grade < 50 || s.attendance < 75 ? (
                        <span className="text-red-600 font-semibold flex items-center gap-1">
                          ⚠️ Attention
                        </span>
                      ) : (
                        <span className="text-green-600 font-semibold">Good</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}