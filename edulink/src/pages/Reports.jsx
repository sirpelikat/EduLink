import React, { useEffect, useState } from "react";
import { db, ref, onValue, update } from "../firebaseRTDB";
import { useAuth } from "../context/AuthContext";

export default function Reports() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTerm, setCurrentTerm] = useState(1); // 1 or 2
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("All");

  // State for the "View Details" Modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  
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
  const getField = (baseField) => `t${currentTerm}_${baseField}`;

  // Helper: Calculate Letter Grade based on scale
  const getLetterGrade = (val) => {
    const mark = Number(val);
    if (mark >= 80) return "A";
    if (mark >= 70) return "B";
    if (mark >= 60) return "C";
    if (mark >= 50) return "D";
    if (mark >= 40) return "E";
    return "F"; // 0-39
  };

  // Helper: Calculate Rank based on TOTAL SCORE
  // MODIFIED: Returns "N/A" if total score is 0
  const getStudentRank = (studentId, studentClass) => {
    // 1. Get the current student's score
    const student = students.find(s => s.id === studentId);
    // Check edits first, then database, default to 0
    const scoreKey = getField("total_score");
    const myScore = Number(student?.[scoreKey] || 0);

    const classmates = students.filter(s => s.class === studentClass);
    const total = classmates.length;

    // 2. If score is 0, they are not ranked yet
    if (myScore === 0) {
        return { rank: "N/A", total };
    }
    
    // 3. Sort classmates by Total Score (Highest to Lowest)
    classmates.sort((a, b) => {
        const scoreA = Number(a[scoreKey] || 0);
        const scoreB = Number(b[scoreKey] || 0);
        return scoreB - scoreA;
    });

    const rank = classmates.findIndex(s => s.id === studentId) + 1;

    return { rank, total };
  };

  // --- ACTIONS ---
  async function handleSign(studentId) {
    if (!window.confirm(`Sign Term ${currentTerm} report electronically?`)) return;
    
    const signFieldUser = getField("signedBy");
    const signFieldDate = getField("signedAt");

    // Save name and date to Firebase
    await update(ref(db, `students/${studentId}`), {
      [signFieldUser]: user.name,
      [signFieldDate]: new Date().toISOString(),
    });
  }

  // Allow teacher to remove sign
  async function handleUnsign(studentId) {
    if (!window.confirm("Are you sure you want to remove this parent signature?")) return;
    
    const signFieldUser = getField("signedBy");
    const signFieldDate = getField("signedAt");

    // Remove signature
    await update(ref(db, `students/${studentId}`), {
      [signFieldUser]: null,
      [signFieldDate]: null,
    });
  } 

  // Save main table edits
  async function handleSaveMain(id) {
    await update(ref(db, `students/${id}`), edits[id]);
    const newEdits = { ...edits };
    delete newEdits[id];
    setEdits(newEdits);
    alert("Main report saved!");
  }

  // Save detailed subject scores from Modal
  async function handleSaveDetails() {
    if (!selectedStudent) return;
    
    const s = edits[selectedStudent.id] || {};
    const original = students.find(st => st.id === selectedStudent.id);
    
    const getVal = (key) => {
        const val = s[key] !== undefined ? s[key] : original[key];
        return Number(val || 0);
    };

    const bm = getVal(getField("subj_bm"));
    const eng = getVal(getField("subj_english"));
    const math = getVal(getField("subj_math"));
    const sci = getVal(getField("subj_science"));

    // Calculate TOTAL SCORE
    const newTotalScore = bm + eng + math + sci;

    // Update Firebase with subjects AND new Total Score
    await update(ref(db, `students/${selectedStudent.id}`), {
        ...edits[selectedStudent.id],
        [getField("total_score")]: newTotalScore
    });

    // Clear edits
    const newEdits = { ...edits };
    delete newEdits[selectedStudent.id];
    setEdits(newEdits);
    
    setSelectedStudent(null);
    alert("Details saved & Ranking updated!");
  }

  const handleEditChange = (id, field, value) => {
    // Validation
    if (!field.includes('behavior') && !field.includes('signed')) {
        const num = Number(value);
        if (num < 0 || num > 100) return; 
    }

    const dbKey = field.startsWith('t1_') || field.startsWith('t2_') ? field : getField(field);

    setEdits(prev => ({
      ...prev,
      [id]: { ...prev[id], [dbKey]: value }
    }));
  };

  // --- RENDER HELPERS ---
  const getValue = (studentId, baseField) => {
      const key = getField(baseField);
      const studentEdits = edits[studentId];
      const studentOriginal = students.find(s => s.id === studentId);
      if (!studentOriginal) return '';
      
      return (studentEdits && studentEdits[key] !== undefined) 
        ? studentEdits[key] 
        : (studentOriginal[key] || '');
  };

  // --- FILTERING ---
  if (loading) return <div className="p-6">Loading...</div>;

  // 1. First, get the list allowed by User Role
  let filteredList = [];
  if (user.role === 'parent') {
    filteredList = students.filter(s => s.parentId === user.uid);
  } else if (user.role === 'teacher') {
    // FIXED TYPO: changed .filters to .filter
    filteredList = students.filter(s => s.class === user.class);
  } else {
    filteredList = students;
  }

  // 2. Filter by Year (if not "All")
  if (selectedYear !== "All") {
    filteredList = filteredList.filter(s => s.class && s.class.startsWith(selectedYear));
  }

  // 3. Then, filter that list by the Search Term
  const viewList = filteredList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.class && s.class.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
<<<<<<< Updated upstream
    <div className="p-6 max-w-7xl mx-auto relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Academic Reports</h1>
=======
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* --- DECORATIVE BACKGROUND --- */}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-r from-indigo-700 to-violet-700 -z-10 shadow-lg"></div>

      <div className="w-full mx-auto px-6 pt-12">
>>>>>>> Stashed changes
        
        <div className="bg-slate-200 p-1 rounded-lg flex gap-1">
            <button onClick={() => setCurrentTerm(1)} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${currentTerm === 1 ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Term 1</button>
            <button onClick={() => setCurrentTerm(2)} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${currentTerm === 2 ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Term 2</button>
        </div>
      </div>

       {/* --- TOOLBAR (Search & Year Filter) --- */}
      {(user.role === 'admin' || user.role === 'teacher') && (
        <div className="mb-4 flex gap-4">
          <input 
            type="text"
            placeholder="Search by student name or class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 max-w-sm px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />

          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-700 font-medium"
          >
            <option value="All">All Years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
            <option value="5">Year 5</option>
            <option value="6">Year 6</option>
          </select>
        </div>
      )}

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full text-left  border-collapse">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
            <tr>
              <th className="px-6 py-4">Student</th>
              <th className="px-4 py-4 text-center w-35">Att. (%)</th>
              <th className="px-4 py-4 text-center w-35">Co-Cu (%)</th>
              <th className="px-4 py-4 text-center w-40">Rank In Class</th>
              <th className="px-6 py-4 text-center w-40">Behavior</th>
              <th className="px-6 py-4 text-center w-40">Status</th>
              <th className="px-6 py-4 text-center w-30">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {viewList.map(s => {
              const attendance = getValue(s.id, 'attendance');
              const cocu = getValue(s.id, 'cocu_attendance');
              const behavior = getValue(s.id, 'behavior');
              const signedBy = s[getField('signedBy')];
              const signedAt = s[getField('signedAt')];
              const isEditing = !!edits[s.id];
              const { rank, total } = getStudentRank(s.id, s.class);

              return (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium">
                    {s.name}
                    <div className="text-xs text-gray-400">{s.class}</div>
                  </td>
                  
                  {(user.role === 'teacher' || user.role === 'admin') ? (
                    <>
                      <td className="px-4 py-4 text-center"><input type="number" className="w-16 border rounded p-1 text-center" value={attendance} onChange={e => handleEditChange(s.id, 'attendance', e.target.value)} /></td>
                      <td className="px-4 py-4 text-center"><input type="number" className="w-16 border rounded p-1 text-center" value={cocu} onChange={e => handleEditChange(s.id, 'cocu_attendance', e.target.value)} /></td>
                      
                      {/* RANK DISPLAY FOR TEACHERS */}
                      <td className="px-4 py-4 text-center font-bold text-slate-700">
                        {rank === "N/A" ? (
                            <span className="text-gray-400 italic font-normal">N/A</span>
                        ) : (
                            <>#{rank} <span className="text-xs text-gray-400 font-normal">/ {total}</span></>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <select className="w-full border rounded p-1 text-sm bg-white" value={behavior} onChange={e => handleEditChange(s.id, 'behavior', e.target.value)}>
                            <option value="">Select</option>
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Satisfactory">Satisfactory</option>
                            <option value="Needs Improvement">Needs Improvement</option>
                        </select>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-4 text-center">{attendance || '-'}%</td>
                      <td className="px-4 py-4 text-center">{cocu || '-'}%</td>
                      
                      {/* RANK DISPLAY FOR PARENTS */}
                      <td className="px-4 py-4 text-center font-bold text-blue-600">
                        {rank === "N/A" ? (
                            <span className="text-gray-400 italic font-normal">N/A</span>
                        ) : (
                            <>#{rank} <span className="text-xs text-gray-400 font-normal">/ {total}</span></>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center"><span className="px-2 py-1 rounded-full bg-gray-100 text-xs">{behavior || 'Pending'}</span></td>
                    </>
                  )}

                  {/* SIGNATURE COLUMN WITH DATE*/}
                  <td className="px-6 py-4 text-center">
                    {signedBy ? (
                      <div className="flex flex-col items-center">
                        <span className="text-green-600 text-[10px] bg-green-100 px-2 py-0.5 rounded font-bold uppercase mb-1">
                          Signed
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          {signedBy}
                        </span>
                        {signedAt && (
                          <span className="text-[10px] text-gray-400">
                            {new Date(signedAt).toLocaleDateString('en-GB')}
                          </span>
                        )}
                        {(user.role === 'teacher' || user.role === 'admin') && (
                            <button 
                                onClick={() => handleUnsign(s.id)}
                                className="mt-1 text-[10px] text-red-500 hover:text-red-700 hover:underline font-medium"
                            >
                                (Unsign)
                            </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Pending</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-right flex justify-end gap-2 items-center">
                    {/* View Details Button */}
                    <button 
                        onClick={() => setSelectedStudent(s)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-semibold border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded transition"
                    >
                        View Details
                    </button>
                    
                    {/* Teacher & Admin : Save Button */}
                    {(user.role === 'teacher' || user.role === 'admin') && isEditing && (
                      <button onClick={()=>handleSaveMain(s.id)} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs">Save</button>
                    )}
                    
                    {/* Parent: Sign Button */}
                    {user.role === 'parent' && !signedBy && (
                      <button onClick={()=>handleSign(s.id)} className="bg-emerald-600 text-white px-3 py-1.5 rounded text-xs">Sign</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- DETAILS MODAL --- */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-100 px-6 py-4 border-b flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">{selectedStudent.name}</h2>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Term {currentTerm} Result Details</p>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
            </div>

            <div className="p-6 space-y-6">
                
                {/* Core Subjects Grid */}
                <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-3 border-b pb-2">Core Subjects</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: "Bahasa Melayu (%)", key: "subj_bm" },
                            { label: "English (%)", key: "subj_english" },
                            { label: "Mathematics (%)", key: "subj_math" },
                            { label: "Science (%)", key: "subj_science" }
                        ].map((subj) => {
    const val = getValue(selectedStudent.id, subj.key);
    const grade = getLetterGrade(val || 0);
    
    // Determine Color based on Grade
    const gradeColor = grade === 'A' ? 'text-green-600' : 
                       grade === 'B' ? 'text-blue-600' : 
                       grade === 'F' ? 'text-red-600' : 'text-slate-600';

    return (
        <div key={subj.key} className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 mb-1">{subj.label}</label>
            <div className="relative">
                <input 
                    type="number" 
                    disabled={user.role !== 'teacher' && user.role !== 'admin'}
                    value={val}
                    onChange={(e) => handleEditChange(selectedStudent.id, getField(subj.key), e.target.value)}
                    className={`w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-16 ${user.role !== 'teacher' ? 'bg-gray-50 text-gray-600' : ''}`}
                    placeholder="0"
                />
                <div className="absolute right-3 top-2 flex items-center gap-2 pointer-events-none">
                    <span className={`text-sm font-bold ${gradeColor}`}>{grade}</span>
                </div>
            </div>
        </div>
    );
})}
                    </div>
                </div>

                {/* Total Score Summary */}
                <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center border border-blue-100">
                    <div>
                        <p className="text-blue-800 font-semibold text-sm">Total Score</p>
                        <p className="text-xs text-blue-600">Sum of 4 Core Subjects</p>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                        {(() => {
                           const bm = Number(getValue(selectedStudent.id, "subj_bm") || 0);
                           const eng = Number(getValue(selectedStudent.id, "subj_english") || 0);
                           const math = Number(getValue(selectedStudent.id, "subj_math") || 0);
                           const sci = Number(getValue(selectedStudent.id, "subj_science") || 0);
                           return bm + eng + math + sci; 
                        })()} <span className="text-sm font-normal text-blue-400">/ 400</span>
                    </div>
                </div>
                
                {/* RANK DISPLAY IN MODAL */}
                <div className="flex justify-between items-center text-sm text-gray-600 mt-2">
                    <span>Class Rank Position:</span>
                    {(() => {
                        const { rank, total } = getStudentRank(selectedStudent.id, selectedStudent.class);
                        return rank === "N/A" ? (
                            <span className="font-bold text-gray-400 italic">N/A</span>
                        ) : (
                            <span className="font-bold text-slate-800">#{rank} <span className="text-xs font-normal text-gray-400">/ {total}</span></span>
                        );
                    })()}
                </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
                <button onClick={() => setSelectedStudent(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Close</button>
                {(user.role === 'teacher' || user.role === 'admin') && (
                    <button onClick={handleSaveDetails} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium shadow-sm transition">
                        Save Details
                    </button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}