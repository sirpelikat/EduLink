import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db, ref, onValue } from "../firebaseRTDB";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  if (loading) return <div className="p-10 text-center text-gray-500">Loading dashboard...</div>;
  if (!user) return <div className="p-10 text-center">Please sign in.</div>;

  // --- 1. FILTER STUDENTS BASED ON ROLE ---
  let myStudents = [];
  let dashboardTitle = "";

  if (user.role === 'parent') {
    myStudents = students.filter(s => s.parentId === user.uid);
    dashboardTitle = "My Children";
  } 
  else if (user.role === 'teacher') {
    if (user.class) {
      myStudents = students.filter(s => s.class === user.class);
      dashboardTitle = `Class ${user.class} Dashboard`;
    } else {
      dashboardTitle = "Teacher Dashboard (No Class Assigned)";
    }
  } 
  else if (user.role === 'admin') {
    myStudents = students;
    dashboardTitle = "School Admin Overview";
  }

  // --- 2. CALCULATE QUICK STATS ---
  const lowAttendance = myStudents.filter(s => s.attendance < 80);
  const atRisk = myStudents.filter(s => s.grade < 50);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{dashboardTitle}</h1>
          <p className="text-slate-500">Welcome back, {user.name}</p>
        </div>
        
        {/* Role Badge */}
        <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide ${
          user.role === 'parent' ? 'bg-amber-100 text-amber-800' :
          user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
          'bg-purple-100 text-purple-800'
        }`}>
          {user.role} Portal
        </span>
      </div>

      {/* STATS OVERVIEW (Visible to Everyone) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{myStudents.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Low Attendance</p>
          <p className={`text-3xl font-bold mt-1 ${lowAttendance.length > 0 ? 'text-orange-600' : 'text-slate-800'}`}>
            {lowAttendance.length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">At Risk (Grades)</p>
          <p className={`text-3xl font-bold mt-1 ${atRisk.length > 0 ? 'text-red-600' : 'text-slate-800'}`}>
            {atRisk.length}
          </p>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      {myStudents.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm text-center border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">No students found.</p>
          {user.role === 'parent' && <p className="text-sm text-gray-400 mt-2">Contact admin if you don't see your child.</p>}
        </div>
      ) : (
        <>
          {/* PARENT VIEW: DETAILED CARDS */}
          {user.role === 'parent' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {myStudents.map(student => (
                <StudentCard key={student.id} student={student} />
              ))}
            </div>
          ) : (
            /* ADMIN/TEACHER VIEW: COMPACT TABLE */
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold border-b">Name</th>
                      <th className="px-6 py-4 font-semibold border-b">Class</th>
                      <th className="px-6 py-4 font-semibold border-b">Attendance</th>
                      <th className="px-6 py-4 font-semibold border-b">Avg Grade</th>
                      <th className="px-6 py-4 font-semibold border-b text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-slate-700">
                    {myStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 border-b last:border-0 transition-colors">
                        <td className="px-6 py-4 font-medium">{s.name}</td>
                        <td className="px-6 py-4">{s.class}</td>
                        <td className="px-6 py-4">
                          <StatusBadge value={s.attendance} type="attendance" />
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge value={s.grade} type="grade" />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link to="/reports" className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 transition">
                            View Report
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function StudentCard({ student }) {
  const isAtRisk = student.grade < 50 || student.attendance < 80;

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border-l-4 ${isAtRisk ? 'border-red-500' : 'border-emerald-500'} flex flex-col`}>
      
      {/* Card Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{student.name}</h2>
          <p className="text-slate-500 font-medium">Class {student.class}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${isAtRisk ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {isAtRisk ? 'Needs Attention' : 'On Track'}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Attendance */}
        <div className="bg-slate-50 p-4 rounded-xl">
          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Attendance</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-slate-700">{student.attendance}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div className={`h-1.5 rounded-full ${student.attendance < 80 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${student.attendance}%` }}></div>
          </div>
        </div>

        {/* Grade */}
        <div className="bg-slate-50 p-4 rounded-xl">
          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Avg Grade</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-slate-700">{student.grade}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div className={`h-1.5 rounded-full ${student.grade < 50 ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${student.grade}%` }}></div>
          </div>
        </div>
      </div>

      {/* Behavior Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs text-slate-500 font-bold uppercase">Behavior Score</p>
          <span className="text-sm font-semibold text-slate-700">{student.behaviorScore || 100}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full bg-amber-400" 
            style={{ width: `${student.behaviorScore || 100}%` }}
          ></div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto pt-4 border-t border-gray-100 flex gap-3">
        <Link to="/reports" className="flex-1 bg-slate-800 text-white text-center py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-900 transition">
          View Full Report
        </Link>
        <Link to="/wellbeing" className="flex-1 bg-white border border-gray-200 text-slate-700 text-center py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">
          Well-being Check
        </Link>
      </div>
    </div>
  );
}

function StatusBadge({ value, type }) {
  let color = 'bg-gray-100 text-gray-800';
  
  if (type === 'attendance') {
    if (value >= 90) color = 'bg-emerald-100 text-emerald-800';
    else if (value >= 80) color = 'bg-yellow-100 text-yellow-800';
    else color = 'bg-red-100 text-red-800';
  } else {
    if (value >= 75) color = 'bg-emerald-100 text-emerald-800';
    else if (value >= 50) color = 'bg-yellow-100 text-yellow-800';
    else color = 'bg-red-100 text-red-800';
  }

  return (
    <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${color}`}>
      {value}%
    </span>
  );
}