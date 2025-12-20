import React, { useEffect, useState } from "react";
import { db, ref, onValue, update } from "../firebaseRTDB";
import { useAuth } from "../context/AuthContext";

export default function Reports() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTerm, setCurrentTerm] = useState(1); // 1 or 2

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

  // --- HELPERS ---
  // Helper to get the correct field name based on the term (e.g., t1_grade vs t2_grade)
  const getField = (baseField) => `t${currentTerm}_${baseField}`;

  // --- ACTIONS ---
  async function handleSign(studentId) {
    if (!window.confirm(`Sign Term ${currentTerm} report electronically?`)) return;
    
    // Save signature specific to the current term
    const signFieldUser = getField("signedBy");
    const signFieldDate = getField("signedAt");

    await update(ref(db, `students/${studentId}`), {
      [signFieldUser]: user.name,
      [signFieldDate]: new Date().toISOString(),
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
    // For numeric fields, ensure valid range
    if (['attendance', 'cocu_attendance', 'grade'].includes(field)) {
        const num = Number(value);
        if (num < 0 || num > 100) return; // Prevent invalid input
    }

    // Construct the term-specific key (e.g., t1_grade)
    const dbKey = getField(field);

    setEdits(prev => ({
      ...prev,
      [id]: { ...prev[id], [dbKey]: value }
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Academic Reports</h1>
        
        {/* TERM TOGGLE BUTTONS */}
        <div className="bg-slate-200 p-1 rounded-lg flex gap-1">
            <button 
                onClick={() => setCurrentTerm(1)}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${currentTerm === 1 ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Term 1
            </button>
            <button 
                onClick={() => setCurrentTerm(2)}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${currentTerm === 2 ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Term 2
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
            <tr>
              <th className="px-6 py-4">Student</th>
              <th className="px-4 py-4 text-center w-24">Class Att. (%)</th>
              <th className="px-4 py-4 text-center w-24">Co-Cu Att. (%)</th>
              <th className="px-4 py-4 text-center w-24">Avg Grade (%)</th>
              <th className="px-6 py-4 text-center w-40">Behavior</th>
              <th className="px-6 py-4 text-center">Signature</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {viewList.map(s => {
              const isEditing = !!edits[s.id];
              
              // Helper to get value from edits (if exists) or original student data
              const getValue = (baseField) => {
                  const key = getField(baseField);
                  // Check edits first, then student data, then default to empty string
                  return (edits[s.id] && edits[s.id][key] !== undefined) ? edits[s.id][key] : (s[key] || '');
              };

              // Get Current Term Data
              const attendance = getValue('attendance');
              const cocuAttendance = getValue('cocu_attendance');
              const grade = getValue('grade');
              const behavior = getValue('behavior');
              const signedBy = s[getField('signedBy')];

              return (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium">
                    {s.name}
                    <br/>
                    <span className="text-xs text-gray-400">{s.class}</span>
                    {isEditing && (
                      <span className="text-yellow-600 text-xs ml-2 font-bold animate-pulse">Unsaved</span>
                    )}
                  </td>
                  
                  {/* EDITABLE FIELDS FOR TEACHERS */}
                  {user.role === 'teacher' ? (
                    <>
                      <td className="px-4 py-4 text-center">
                        <input type="number" className="w-16 border rounded p-1 text-center" 
                          value={attendance} 
                          onChange={e => handleEditChange(s.id, 'attendance', e.target.value)} 
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input type="number" className="w-16 border rounded p-1 text-center" 
                          value={cocuAttendance} 
                          onChange={e => handleEditChange(s.id, 'cocu_attendance', e.target.value)} 
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input type="number" className="w-16 border rounded p-1 text-center" 
                          value={grade} 
                          onChange={e => handleEditChange(s.id, 'grade', e.target.value)} 
                          placeholder="0"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <select 
                            className="w-full border rounded p-1 text-sm bg-white"
                            value={behavior}
                            onChange={e => handleEditChange(s.id, 'behavior', e.target.value)}
                        >
                            <option value="">- Select -</option>
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Satisfactory">Satisfactory</option>
                            <option value="Needs Improvement">Needs Improvement</option>
                        </select>
                      </td>
                    </>
                  ) : (
                    // READ ONLY FOR PARENTS/ADMIN
                    <>
                      <td className="px-4 py-4 text-center">{attendance || '-'}%</td>
                      <td className="px-4 py-4 text-center">{cocuAttendance || '-'}%</td>
                      <td className="px-4 py-4 text-center font-bold">{grade || '-'}%</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                            ${behavior === 'Excellent' ? 'bg-green-100 text-green-700' : 
                              behavior === 'Good' ? 'bg-blue-100 text-blue-700' :
                              behavior === 'Needs Improvement' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}
                        `}>
                            {behavior || 'Pending'}
                        </span>
                      </td>
                    </>
                  )}

                  {/* SIGNATURE STATUS (Per Term) */}
                  <td className="px-6 py-4 text-center">
                    {signedBy ? (
                      <div className="flex flex-col items-center">
                        <span className="text-green-600 text-xs bg-green-100 px-2 py-1 rounded mb-1">Signed</span>
                        <span className="text-[10px] text-gray-400">by {signedBy}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Pending</span>
                    )}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-4 text-right">
                    {user.role === 'teacher' && isEditing && (
                      <button onClick={()=>handleSave(s.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-xs shadow-sm">Save</button>
                    )}
                    {user.role === 'parent' && !signedBy && (
                      <button onClick={()=>handleSign(s.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded text-xs shadow-sm">
                        Sign Term {currentTerm}
                      </button>
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
}``