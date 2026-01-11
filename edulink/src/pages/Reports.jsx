import React, { useEffect, useState } from "react";
import { db, ref, onValue, update } from "../firebaseRTDB";
import { useAuth } from "../context/AuthContext";

<<<<<<< Updated upstream
=======
// --- CONSTANTS ---
const TOTAL_SCHOOL_DAYS = 120; // Maximum school days per term
const TOTAL_COCU_DAYS = 12; // Maximum Co-Curriculum meetings per term

// --- ICONS (accept className props) ---
const SearchIcon = ({ className = "w-5 h-5 text-indigo-400" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const FilterIcon = ({ className = "w-5 h-5 text-indigo-500" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    />
  </svg>
);

const CheckBadgeIcon = ({ className = "w-4 h-4 mr-1" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ArrowLeftIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const UsersIcon = ({ className = "w-5 h-5 opacity-50" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const StarIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const TargetIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const CalendarIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const UploadIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const DownloadIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

// --- PROGRESS BAR COMPONENT ---
const ProgressBar = ({ value, colorClass }) => (
  <div className="w-full h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
    <div
      className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
      style={{ width: `${Math.min(Number(value) || 0, 100)}%` }}
    />
  </div>
);

>>>>>>> Stashed changes
export default function Reports() {
  const { user } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
<<<<<<< Updated upstream
  const [currentTerm, setCurrentTerm] = useState(1); // 1 or 2
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("All");

  // State for the "View Details" Modal
=======

  const [currentTerm, setCurrentTerm] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [importing, setImporting] = useState(false);

  // For Admin: "" means show dashboard, "1"-"6" means show that year
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    return "F"; // 0-39
=======
    return "F";
>>>>>>> Stashed changes
  };

  // Helper: Calculate Rank based on TOTAL SCORE
  // MODIFIED: Returns "N/A" if total score is 0
  const getStudentRank = (studentId, studentClass) => {
<<<<<<< Updated upstream
    // 1. Get the current student's score
    const student = students.find(s => s.id === studentId);
    // Check edits first, then database, default to 0
=======
    const student = students.find((s) => s.id === studentId);
    if (!student || !studentClass) return { classRank: "N/A", classTotal: 0, yearRank: "N/A", yearTotal: 0 };

>>>>>>> Stashed changes
    const scoreKey = getField("total_score");
    const myScore = Number(student?.[scoreKey] || 0);

<<<<<<< Updated upstream
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
=======
    if (myScore === 0) return { classRank: "N/A", classTotal: 0, yearRank: "N/A", yearTotal: 0 };

    // 1. Calculate Class Rank
    const classmates = students.filter((s) => s.class === studentClass);
    classmates.sort((a, b) => Number(b[scoreKey] || 0) - Number(a[scoreKey] || 0));
    const classRank = classmates.findIndex((s) => s.id === studentId) + 1;

    // 2. Calculate Year Rank (Assuming Year is the first char of class, e.g. "1 A" -> "1")
    const yearPrefix = studentClass.toString().charAt(0);
    const yearmates = students.filter((s) => s.class && s.class.toString().startsWith(yearPrefix));
    yearmates.sort((a, b) => Number(b[scoreKey] || 0) - Number(a[scoreKey] || 0));
    const yearRank = yearmates.findIndex((s) => s.id === studentId) + 1;

    return {
      classRank,
      classTotal: classmates.length,
      yearRank,
      yearTotal: yearmates.length,
    };
  };

  const getYearCount = (year) => {
    return students.filter((s) => s.class && s.class.startsWith(year.toString())).length;
  };

  const getValue = (studentId, baseField) => {
    const key = getField(baseField);
    const studentEdits = edits[studentId];
    const studentOriginal = students.find((s) => s.id === studentId);
    if (!studentOriginal) return "";
    return studentEdits && studentEdits[key] !== undefined ? studentEdits[key] : studentOriginal[key] || "";
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    const original = students.find(st => st.id === selectedStudent.id);
    
    const getVal = (key) => {
        const val = s[key] !== undefined ? s[key] : original[key];
        return Number(val || 0);
    };

    const bm = getVal(getField("subj_bm"));
    const eng = getVal(getField("subj_english"));
    const math = getVal(getField("subj_math"));
    const sci = getVal(getField("subj_science"));
=======
    const original = students.find((st) => st.id === selectedStudent.id);

    const getVal = (key) => Number((s[key] !== undefined ? s[key] : original?.[key]) || 0);

    const newTotalScore =
      getVal(getField("subj_bm")) +
      getVal(getField("subj_english")) +
      getVal(getField("subj_math")) +
      getVal(getField("subj_science")) +
      getVal(getField("subj_sejarah")) +
      getVal(getField("subj_geografi"));
>>>>>>> Stashed changes

    // Calculate TOTAL SCORE
    const newTotalScore = bm + eng + math + sci;

    // Update Firebase with subjects AND new Total Score
    await update(ref(db, `students/${selectedStudent.id}`), {
<<<<<<< Updated upstream
        ...edits[selectedStudent.id],
        [getField("total_score")]: newTotalScore
=======
      ...edits[selectedStudent.id],
      [getField("total_score")]: newTotalScore,
>>>>>>> Stashed changes
    });

    // Clear edits
    const newEdits = { ...edits };
    delete newEdits[selectedStudent.id];
    setEdits(newEdits);
    
    setSelectedStudent(null);
    alert("Details saved & Ranking updated!");
  }

  const handleEditChange = (id, field, value) => {
<<<<<<< Updated upstream
    // Validation
    if (!field.includes('behavior') && !field.includes('signed')) {
        const num = Number(value);
        if (num < 0 || num > 100) return; 
    }

    const dbKey = field.startsWith('t1_') || field.startsWith('t2_') ? field : getField(field);

    setEdits(prev => ({
=======
    const num = Number(value);

    // 1. Attendance Days Validation
    if (field.includes("attendance_days")) {
      if (num < 0 || num > TOTAL_SCHOOL_DAYS) return;
    }
    // 2. Co-Curriculum Days Validation
    else if (field.includes("cocu_days")) {
      if (num < 0 || num > TOTAL_COCU_DAYS) return;
    }
    // 3. Marks Validation (0-100)
    else if (
      !field.includes("behavior") &&
      !field.includes("signed") &&
      !field.includes("strength") &&
      !field.includes("weakness")
    ) {
      if (num < 0 || num > 100) return;
    }

    // if already passed a full DB key (t1_... / t2_...), keep it
    const dbKey = field.startsWith("t1_") || field.startsWith("t2_") ? field : getField(field);

    setEdits((prev) => ({
>>>>>>> Stashed changes
      ...prev,
      [id]: { ...prev[id], [dbKey]: value },
    }));
  };

<<<<<<< Updated upstream
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
    <div className="p-6 max-w-7xl mx-auto relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Academic Reports</h1>
        
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
=======
  // 1. GENERATE TEMPLATE FUNCTION
  const downloadTemplate = () => {
    const headers = [
      "Student ID", "Name", "Term", 
      "BM", "English", "Math", "Science", "Sejarah", "Geografi", 
      "AttDays", "CocuDays"
    ];

    // Filter students: Teachers get their class, Admins get filtered view
    const studentsToExport = user.role === 'teacher' 
      ? students.filter(s => s.class === user.class)
      : viewList;

    const rows = studentsToExport.map(s => {
      const safeName = `"${s.name}"`; 
      
      // FIX: Prepend a tab character "\t" so Excel treats the ID as text, not a formula
      const safeId = `"\t${s.id}"`; 

      return [
        safeId, safeName, currentTerm, 
        "", "", "", "", "", "", "", "" 
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Marks_Template_Term${currentTerm}_${user.class || 'Report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. IMPORT MARKS FUNCTION
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const text = String(event.target?.result || "");
      const rows = text
        .split("\n")
        .map((row) => row.trim())
        .filter((r) => r);

      let success = 0;
      let failed = 0;

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(",").map((c) => c.replace(/"/g, "").trim());

        // 0:ID, 1:Name, 2:Term, 3:BM, 4:Eng, 5:Math, 6:Sci, 7:Sej, 8:Geo, 9:Att, 10:Cocu
        const [id, _name, termRaw, bm, eng, math, sci, sej, geo, att, cocu] = cols;

        if (!id) continue;

        const student = students.find((s) => s.id === id);
        if (!student) {
          failed++;
          continue;
        }
        if (user.role === "teacher" && student.class !== user.class) {
          failed++;
          continue;
        }

        const term = termRaw ? Number(termRaw) : currentTerm;
        const prefix = `t${term}_`;

        const updates = {};
        let currentTotal = 0;

        const addMark = (key, val, existingVal) => {
          let num = Number(existingVal) || 0;
          if (val !== "" && !Number.isNaN(Number(val))) {
            const parsed = Number(val);
            if (parsed >= 0 && parsed <= 100) {
              updates[`${prefix}${key}`] = parsed;
              num = parsed;
            }
          }
          currentTotal += num;
        };

        addMark("subj_bm", bm, student[`${prefix}subj_bm`]);
        addMark("subj_english", eng, student[`${prefix}subj_english`]);
        addMark("subj_math", math, student[`${prefix}subj_math`]);
        addMark("subj_science", sci, student[`${prefix}subj_science`]);
        addMark("subj_sejarah", sej, student[`${prefix}subj_sejarah`]);
        addMark("subj_geografi", geo, student[`${prefix}subj_geografi`]);

        updates[`${prefix}total_score`] = currentTotal;

        // IMPORTANT: store attendance/cocu with term prefix (so getValue works)
        if (att !== "" && !Number.isNaN(Number(att))) updates[`${prefix}attendance_days`] = Number(att);
        if (cocu !== "" && !Number.isNaN(Number(cocu))) updates[`${prefix}cocu_days`] = Number(cocu);

        if (Object.keys(updates).length > 0) {
          try {
            await update(ref(db, `students/${id}`), updates);
            success++;
          } catch (err) {
            console.error(err);
            failed++;
          }
        }
      }

      alert(`Import Complete!\nUpdated: ${success} students\nSkipped/Failed: ${failed}`);
      setImporting(false);
      e.target.value = null;
    };

    reader.readAsText(file);
  };

  // --- RENDERING ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-indigo-600 font-bold animate-pulse">
        Loading Reports...
      </div>
    );
  }

  // 1. DASHBOARD MODE (Only for Admin when no year is selected)
  if (user.role === "admin" && !selectedYear) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-r from-indigo-700 to-violet-700 -z-10 shadow-lg"></div>

        <div className="max-w-6xl mx-auto px-6 pt-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-black text-black tracking-tight drop-shadow-lg mb-3">
              Academic Dashboard
            </h1>
            <p className="text-indigo-800 font-medium text-lg bg-black/10 inline-block px-4 py-1 rounded-full backdrop-blur-sm">
              Select a Year Level to manage student reports
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((year) => {
              const count = getYearCount(year);
              return (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year.toString())}
                  className="group relative bg-white rounded-3xl p-8 shadow-xl shadow-slate-200 hover:shadow-2xl hover:shadow-indigo-200/50 hover:-translate-y-1 transition-all duration-300 border border-slate-100 overflow-hidden text-left"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-10 -mt-10 group-hover:bg-indigo-100 transition-colors"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-sm font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                        Year Level
                      </span>
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    <h2 className="text-5xl font-black text-slate-800 mb-2">{year}</h2>
                    <div className="flex items-center text-slate-500 font-medium group-hover:text-indigo-600 transition-colors">
                      <UsersIcon />
                      <span className="ml-2">{count} Students</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 2. LIST MODE (Standard View)
  let viewList =
    user.role === "parent"
      ? students.filter((s) => s.parentId === user.uid)
      : user.role === "teacher"
      ? students.filter((s) => s.class === user.class)
      : students;

  let availableClasses = undefined;

  if (user.role === "admin") {
    const distinctClasses = [...new Set(students.map((s) => s.class).filter(Boolean))].sort();
    availableClasses = selectedYear ? distinctClasses.filter((c) => c.startsWith(selectedYear)) : distinctClasses;

    if (selectedYear) viewList = viewList.filter((s) => s.class && s.class.startsWith(selectedYear));
    if (selectedClass) viewList = viewList.filter((s) => s.class === selectedClass);
  }

  viewList = viewList.filter(
    (s) =>
      (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.class && s.class.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* --- DECORATIVE BACKGROUND --- */}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-r from-indigo-700 to-violet-700 -z-10 shadow-lg"></div>

      <div className="max-w-7xl mx-auto px-6 pt-12">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* BACK BUTTON (High Contrast) */}
            {user.role === "admin" && (
              <button
                onClick={() => {
                  setSelectedYear("");
                  setSelectedClass("");
                  setSearchTerm("");
                }}
                className="group flex items-center gap-2 bg-white text-indigo-900 px-5 py-3 rounded-full shadow-lg shadow-indigo-900/20 hover:bg-indigo-50 hover:scale-105 transition-all duration-200 border border-white/50 w-fit"
              >
                <ArrowLeftIcon className="w-5 h-5 text-indigo-700 group-hover:-translate-x-1 transition-transform stroke-2" />
                <span className="font-extrabold text-sm tracking-wide">Back to Dashboard</span>
              </button>
            )}

            <div>
              <h1 className="text-4xl md:text-5xl font-black text-black tracking-tight drop-shadow-md">
                {user.role === "admin" ? `Year ${selectedYear} Reports` : "Academic Reports"}
              </h1>

              {/* SUBTITLE (High Contrast Pill) */}
              <p className="text-black-50 mt-3 font-semibold bg-white/10 inline-block px-4 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-sm">
                {user.role === "teacher"
                  ? `Welcome, ${user.name || "Teacher"} • Class ${user.class}`
                  : user.role === "admin"
                  ? `Welcome, ${user.name || "Admin"} • Manage Performance`
                  : `Welcome, ${user.name || "Parent"}`}
              </p>
            </div>
          </div>

          {/* Term Switcher */}
          <div className="bg-white/10 p-1.5 rounded-xl backdrop-blur-md flex shadow-inner border border-white/20">
            {[1, 2].map((term) => (
              <button
                key={term}
                onClick={() => setCurrentTerm(term)}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                  currentTerm === term ? "bg-white text-indigo-700 shadow-lg scale-105" : "text-indigo-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                Term {term}
              </button>
            ))}
          </div>
        </div>

        {/* --- CONTROL BAR --- */}
        <div className="bg-white rounded-2xl p-5 shadow-xl shadow-slate-200/50 mb-8 border border-slate-100 flex flex-col md:flex-row gap-4 items-center relative z-10">
          {/* Search */}
          <div className="flex items-center gap-3 w-full md:w-auto flex-1">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-slate-700 placeholder-slate-400 font-medium transition-all"
              />
            </div>
          </div>

          {/* Import/Export Buttons for Teacher/Admin */}
          {(user.role === "teacher" || user.role === "admin") && (
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={downloadTemplate}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-3 rounded-xl font-bold hover:bg-indigo-100 transition-all border border-indigo-100"
                title="Download CSV Template"
              >
                <DownloadIcon />
                <span className="text-xs md:text-sm">Template</span>
              </button>

              <label className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 hover:-translate-y-0.5 transition-all cursor-pointer">
                {importing ? (
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  <UploadIcon />
                )}
                <span className="text-xs md:text-sm">{importing ? "Importing..." : "Import CSV"}</span>
                <input type="file" accept=".csv" onChange={handleFileUpload} disabled={importing} className="hidden" />
              </label>
            </div>
          )}

          {/* Admin Filter */}
          {user.role === "admin" && (
            <div className="flex gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <div className="absolute left-3 top-3.5 z-10">
                  <FilterIcon className="w-5 h-5 text-indigo-500" />
                </div>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full md:w-auto pl-10 pr-8 py-3 bg-slate-50 border-none rounded-xl font-semibold text-slate-600 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer hover:bg-slate-100 transition-colors appearance-none min-w-[180px]"
                >
                  <option value="">All Classes</option>
                  {availableClasses?.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* --- TABLE AREA --- */}
        <div className="overflow-x-auto pb-10">
          <table className="w-full text-left border-separate border-spacing-y-4">
            <thead>
              <tr className="text-slate-400 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 pb-2">Student Info</th>
                <th className="px-4 pb-2 text-center w-32">Attendance</th>
                <th className="px-4 pb-2 text-center w-32">Co-Curriculum</th>
                <th className="px-4 pb-2 text-center w-32">Rankings</th>
                <th className="px-6 pb-2 text-center w-1/3">Performance Summary</th>
                <th className="px-6 pb-2 text-center w-32">Status</th>
                <th className="px-6 pb-2 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {viewList.length > 0 ? (
                viewList.map((s) => {
                  const attendanceDays = getValue(s.id, "attendance_days") || 0;
                  const attendancePct = Math.round((Number(attendanceDays) / TOTAL_SCHOOL_DAYS) * 100) || 0;

                  const cocuDays = getValue(s.id, "cocu_days") || 0;
                  const cocuPct = Math.round((Number(cocuDays) / TOTAL_COCU_DAYS) * 100) || 0;

                  const strength = getValue(s.id, "strength");
                  const weakness = getValue(s.id, "weakness");
                  const signedBy = s[getField("signedBy")];
                  const signedAt = s[getField("signedAt")];

                  const isEditing = !!edits[s.id];
                  const { classRank, classTotal, yearRank, yearTotal } = getStudentRank(s.id, s.class);

                  return (
                    <tr
                      key={s.id}
                      className="bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 rounded-2xl group"
                    >
                      <td className="px-6 py-5 rounded-l-2xl border-l-4 border-transparent hover:border-indigo-500 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center font-bold text-lg shadow-sm border border-indigo-50">
                            {(s.name || "?").charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-base">{s.name}</div>
                            <div className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-1">
                              {s.class}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Attendance */}
                      <td className="px-4 py-5 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-slate-400 mb-0.5">
                            {attendanceDays}/{TOTAL_SCHOOL_DAYS} Days
                          </span>
                          <div className="font-bold text-slate-700 text-sm">{attendancePct}%</div>
                          <ProgressBar value={attendancePct} colorClass={attendancePct < 80 ? "bg-red-500" : "bg-emerald-500"} />
                        </div>
                      </td>

                      {/* Co-cu */}
                      <td className="px-4 py-5 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-slate-400 mb-0.5">
                            {cocuDays}/{TOTAL_COCU_DAYS} Days
                          </span>
                          <div className="font-bold text-slate-700 text-sm">{cocuPct}%</div>
                          <ProgressBar value={cocuPct} colorClass="bg-blue-500" />
                        </div>
                      </td>

                      {/* Rankings */}
                      <td className="px-4 py-5 text-center">
                        {classRank !== "N/A" ? (
                          <div className="flex flex-col gap-1 items-center justify-center">
                            <div className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md w-full whitespace-nowrap">
                              Class: #{classRank} <span className="text-slate-400 font-normal">/{classTotal}</span>
                            </div>
                            <div className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md w-full whitespace-nowrap border border-indigo-100">
                              Year: #{yearRank} <span className="text-indigo-400 font-normal">/{yearTotal}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-2xl">-</span>
                        )}
                      </td>

                      {/* Performance Summary */}
                      <td className="px-6 py-5 align-top">
                        {user.role === "teacher" || user.role === "admin" ? (
                          <div className="flex flex-col gap-3">
                            <div className="relative">
                              <span className="absolute left-3 top-3 text-emerald-500">
                                <StarIcon />
                              </span>
                              <textarea
                                placeholder="Highlights & Strengths..."
                                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none transition-all placeholder:text-slate-400 min-h-[60px]"
                                rows={2}
                                value={strength}
                                onChange={(e) => handleEditChange(s.id, "strength", e.target.value)}
                              />
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-3 text-amber-500">
                                <TargetIcon />
                              </span>
                              <textarea
                                placeholder="Areas for Improvement..."
                                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none transition-all placeholder:text-slate-400 min-h-[60px]"
                                rows={2}
                                value={weakness}
                                onChange={(e) => handleEditChange(s.id, "weakness", e.target.value)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            <div className="relative group p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/50 shadow-sm hover:shadow-md transition-all">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="p-1 rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
                                  <StarIcon />
                                </div>
                                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Strengths</span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed font-medium pl-1">
                                {strength || <span className="italic text-slate-400 font-normal">No specific comments recorded.</span>}
                              </p>
                            </div>

                            <div className="relative group p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/50 shadow-sm hover:shadow-md transition-all">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="p-1 rounded-full bg-amber-100 text-amber-600 shadow-sm">
                                  <TargetIcon />
                                </div>
                                <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Areas to Improve</span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed font-medium pl-1">
                                {weakness || <span className="italic text-slate-400 font-normal">No specific comments recorded.</span>}
                              </p>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5 text-center">
                        {signedBy ? (
                          <div className="flex flex-col items-center">
                            <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center mb-1 border border-emerald-200 shadow-sm">
                              <CheckBadgeIcon /> Signed
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {signedAt ? new Date(signedAt).toLocaleDateString() : ""}
                            </span>
                            {(user.role === "teacher" || user.role === "admin") && (
                              <button
                                onClick={() => handleUnsign(s.id)}
                                className="text-[10px] text-red-400 hover:text-red-600 mt-1 underline decoration-dashed"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-slate-200">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5 text-right rounded-r-2xl">
                        <div className="flex flex-col gap-2 items-end">
                          <button
                            onClick={() => setSelectedStudent(s)}
                            className="text-indigo-600 hover:bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-lg text-xs font-bold transition-all w-24 shadow-sm hover:shadow-md"
                          >
                            Details
                          </button>

                          {(user.role === "teacher" || user.role === "admin") && isEditing && (
                            <button
                              onClick={() => handleSaveMain(s.id)}
                              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold w-24 shadow-md hover:bg-indigo-700 transition-all animate-pulse"
                            >
                              Save
                            </button>
                          )}

                          {user.role === "parent" && !signedBy && (
                            <button
                              onClick={() => handleSign(s.id)}
                              className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold w-24 shadow-md hover:bg-emerald-600 transition-all"
                            >
                              Sign Report
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-20">
                    <div className="inline-block p-6 rounded-full bg-white shadow-lg mb-4">
                      <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                    </div>
                    <p className="text-slate-500 font-medium">No students found matching your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
>>>>>>> Stashed changes
      </div>

      {/* --- DETAILS MODAL --- */}
      {selectedStudent && (
<<<<<<< Updated upstream
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
=======
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/20 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 flex justify-between items-start relative shrink-0">
              <div className="absolute top-0 right-0 p-10 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <div className="relative z-10">
                <h2 className="text-2xl font-black text-white tracking-tight">{selectedStudent.name}</h2>
                <p className="text-indigo-100 font-medium mt-1">Detailed Academic Performance • Term {currentTerm}</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all relative z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-8 bg-slate-50 overflow-y-auto">
              {/* Attendance & Co-Cu Input */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <CalendarIcon /> Attendance & Activity
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Attendance */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">
                      School Attendance (Max {TOTAL_SCHOOL_DAYS})
                    </label>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max={TOTAL_SCHOOL_DAYS}
                        disabled={user.role !== "teacher" && user.role !== "admin"}
                        value={getValue(selectedStudent.id, "attendance_days")}
                        onChange={(e) => handleEditChange(selectedStudent.id, "attendance_days", e.target.value)}
                        className="flex-1 font-black text-2xl text-slate-800 bg-white p-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-center"
                        placeholder="0"
                      />
                      <div className="text-sm font-bold text-slate-400">/ {TOTAL_SCHOOL_DAYS}</div>
>>>>>>> Stashed changes
                    </div>

                    <div className="mt-3 flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-100">
                      <span className="text-xs font-semibold text-slate-400">Attendance %</span>
                      <span
                        className={`text-sm font-black ${
                          (Number(getValue(selectedStudent.id, "attendance_days") || 0) / TOTAL_SCHOOL_DAYS) * 100 < 80
                            ? "text-red-500"
                            : "text-emerald-500"
                        }`}
                      >
                        {Math.round((Number(getValue(selectedStudent.id, "attendance_days") || 0) / TOTAL_SCHOOL_DAYS) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Co-Curriculum */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">
                      Co-Curriculum (Max {TOTAL_COCU_DAYS})
                    </label>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max={TOTAL_COCU_DAYS}
                        disabled={user.role !== "teacher" && user.role !== "admin"}
                        value={getValue(selectedStudent.id, "cocu_days")}
                        onChange={(e) => handleEditChange(selectedStudent.id, "cocu_days", e.target.value)}
                        className="flex-1 font-black text-2xl text-slate-800 bg-white p-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-center"
                        placeholder="0"
                      />
                      <div className="text-sm font-bold text-slate-400">/ {TOTAL_COCU_DAYS}</div>
                    </div>

                    <div className="mt-3 flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-100">
                      <span className="text-xs font-semibold text-slate-400">Participation %</span>
                      <span className="text-sm font-black text-blue-500">
                        {Math.round((Number(getValue(selectedStudent.id, "cocu_days") || 0) / TOTAL_COCU_DAYS) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject Breakdown */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Subject Breakdown</h3>
                  {user.role !== "parent" && (
                    <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-1 rounded font-semibold">Editing Mode</span>
                  )}
                </div>

<<<<<<< Updated upstream
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
=======
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Bahasa Melayu", key: "subj_bm", icon: "📖" },
                    { label: "Bahasa Inggeris", key: "subj_english", icon: "🔤" },
                    { label: "Matematik", key: "subj_math", icon: "📐" },
                    { label: "Sains", key: "subj_science", icon: "🧬" },
                    { label: "Pendidikan Islam/Moral", key: "subj_sejarah", icon: "🏛️" },
                    { label: "Pendiikan Jasmani", key: "subj_geografi", icon: "🌍" },
                  ].map((subj) => {
                    const val = getValue(selectedStudent.id, subj.key);
                    const grade = getLetterGrade(val || 0);

                    const gradeColor =
                      grade === "A"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : grade === "B"
                        ? "bg-blue-100 text-blue-700 border-blue-200"
                        : grade === "F"
                        ? "bg-red-100 text-red-700 border-red-200"
                        : "bg-slate-100 text-slate-700 border-slate-200";

                    return (
                      <div
                        key={subj.key}
                        className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-xl shadow-inner border border-slate-100">
                          {subj.icon}
                        </div>

                        <div className="flex-1">
                          <label className="text-xs font-bold text-slate-400 uppercase block mb-1">{subj.label}</label>
                          <input
                            type="number"
                            disabled={user.role !== "teacher" && user.role !== "admin"}
                            value={val}
                            onChange={(e) => handleEditChange(selectedStudent.id, getField(subj.key), e.target.value)}
                            className={`w-full font-bold text-lg text-slate-800 bg-transparent outline-none p-0 border-b border-transparent focus:border-indigo-500 transition-colors ${
                              user.role !== "teacher" ? "" : "placeholder-slate-200"
                            }`}
                            placeholder="0"
                          />
                        </div>

                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg border ${gradeColor}`}>
                          {grade}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Summary Cards */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/20 transition-all"></div>
                  <p className="text-indigo-100 font-medium text-sm uppercase tracking-wide mb-1">Total Score</p>
                  <div className="flex items-baseline gap-2 relative z-10">
                    <span className="text-5xl font-black tracking-tighter">
                      {(() => {
                        const bm = Number(getValue(selectedStudent.id, "subj_bm") || 0);
                        const eng = Number(getValue(selectedStudent.id, "subj_english") || 0);
                        const math = Number(getValue(selectedStudent.id, "subj_math") || 0);
                        const sci = Number(getValue(selectedStudent.id, "subj_science") || 0);
                        const sej = Number(getValue(selectedStudent.id, "subj_sejarah") || 0);
                        const geo = Number(getValue(selectedStudent.id, "subj_geografi") || 0);
                        return bm + eng + math + sci + sej + geo;
                      })()}
                    </span>
                    <span className="text-xl text-indigo-200 font-bold">/ 600</span>
                  </div>
                </div>

                <div className="flex-1 flex gap-3">
                  {(() => {
                    const { classRank, classTotal, yearRank, yearTotal } = getStudentRank(selectedStudent.id, selectedStudent.class);

                    return (
                      <>
                        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-center shadow-sm">
                          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wide mb-1">Class Position</p>
                          {classRank === "N/A" ? (
                            <span className="text-xl font-bold text-slate-300 italic">N/A</span>
                          ) : (
                            <div className="flex flex-col">
                              <span className="text-3xl font-black text-slate-800">#{classRank}</span>
                              <span className="text-xs font-semibold text-slate-400">
                                Top {classTotal ? Math.round((classRank / classTotal) * 100) : 0}%
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 bg-white border border-indigo-100 rounded-2xl p-4 flex flex-col justify-center shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-8 bg-indigo-50 rounded-full -mr-4 -mt-4"></div>
                          <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-wide mb-1 relative z-10">Year Position</p>
                          {yearRank === "N/A" ? (
                            <span className="text-xl font-bold text-indigo-200 italic relative z-10">N/A</span>
                          ) : (
                            <div className="flex flex-col relative z-10">
                              <span className="text-3xl font-black text-indigo-600">#{yearRank}</span>
                              <span className="text-xs font-semibold text-indigo-400">of {yearTotal} Students</span>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-8 py-5 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Close
              </button>

              {(user.role === "teacher" || user.role === "admin") && (
                <button
                  onClick={handleSaveDetails}
                  className="px-6 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all"
                >
                  Save Changes
                </button>
              )}
>>>>>>> Stashed changes
            </div>
          </div>
        </div>
      )}
    </div>
  );
}