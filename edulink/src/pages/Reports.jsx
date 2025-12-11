import React, { useEffect, useState } from "react";
import { db, ref, onValue, update } from "../firebaseRTDB";
import { useAuth } from "../context/AuthContext";

export default function Reports() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for inline editing (Teachers only)
  const [edits, setEdits] = useState({}); 

  useEffect(() => {
    const unsub = onValue(ref(db, "students"), (snap) => {
      const data = snap.val();
      setStudents(data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : []);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- ACTIONS ---
  async function handleSign(studentId) {
    if (!window.confirm("Sign this report electronically?")) return;
    await update(ref(db, `students/${studentId}`), {
      signedBy: user.name,
      signedAt: new Date().toISOString(),
    });
  }

  async function handleSave(id) {
    await update(ref(db, `students/${id}`), edits[id]);
    const newEdits = { ...edits };
    delete newEdits[id];
    setEdits(newEdits);
    alert("Saved!");
  }

  const handleEditChange = (id, field, value) => {
    setEdits(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: Number(value) }
    }));
  };

  // --- FILTERING ---
  if (loading) return <div className="p-6">Loading...</div>;
  
  let viewList = [];
  if (user.role === 'parent') {
    viewList = students.filter(s => s.parentId === user.uid);
  } else if (user.role === 'teacher') {
    viewList = students.filter(s => s.class === user.class);
  } else {
    viewList = students; // Admin sees all
  }
  

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-slate-800">Academic Reports</h1>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
            <tr>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4 text-center">Attendance (%)</th>
              <th className="px-6 py-4 text-center">Average Grade (%)</th>
              <th className="px-6 py-4 text-center">Behavior (0-100)</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {viewList.map(s => {
              const isEditing = !!edits[s.id];
              const display = isEditing ? { ...s, ...edits[s.id] } : s;

              return (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium">
                    {s.name} <br/> <span className="text-xs text-gray-400">{s.class}</span>
                  </td>
                  
                  {/* EDITABLE FIELDS FOR TEACHERS */}
                  {user.role === 'teacher' ? (
                    <>
                      <td className="px-6 py-4 text-center">
                        <input type="number" className="w-16 border rounded p-1 text-center" 
                          value={display.attendance} onChange={e=>handleEditChange(s.id, 'attendance', e.target.value)} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input type="number" className="w-16 border rounded p-1 text-center" 
                          value={display.grade} onChange={e=>handleEditChange(s.id, 'grade', e.target.value)} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input type="number" className="w-16 border rounded p-1 text-center" 
                          value={display.behaviorScore} onChange={e=>handleEditChange(s.id, 'behaviorScore', e.target.value)} />
                      </td>
                    </>
                  ) : (
                    // READ ONLY FOR PARENTS/ADMIN
                    <>
                      <td className="px-6 py-4 text-center">{s.attendance}%</td>
                      <td className="px-6 py-4 text-center font-bold">{s.grade}%</td>
                      <td className="px-6 py-4 text-center">{s.behaviorScore}</td>
                    </>
                  )}

                  {/* SIGNATURE STATUS */}
                  <td className="px-6 py-4 text-center">
                    {s.signedBy ? (
                      <span className="text-green-600 text-xs bg-green-100 px-2 py-1 rounded">Signed by {s.signedBy}</span>
                    ) : (
                      <span className="text-gray-400 text-xs">Pending Signature</span>
                    )}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-4 text-right">
                    {user.role === 'teacher' && isEditing && (
                      <button onClick={()=>handleSave(s.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Save</button>
                    )}
                    {user.role === 'parent' && !s.signedBy && (
                      <button onClick={()=>handleSign(s.id)} className="bg-emerald-600 text-white px-3 py-1 rounded text-xs">Sign Report</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {viewList.length === 0 && <div className="p-6 text-center text-gray-500">No records found.</div>}
      </div>
    </div>
  );
}