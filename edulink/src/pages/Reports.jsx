import React, { useEffect, useMemo, useState } from "react";
import { db, ref, onValue, update } from "../firebaseRTDB";
import { useAuth } from "../context/AuthContext";

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

export default function Reports() {
  const { user } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentTerm, setCurrentTerm] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [importing, setImporting] = useState(false);

  // Admin: "" = dashboard, "1"-"6" = list for year
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  const [selectedStudent, setSelectedStudent] = useState(null);

  // inline edits cache: { [studentId]: { fieldKey: value, ... } }
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

  const getLetterGrade = (val) => {
    const mark = Number(val);
    if (mark >= 80) return "A";
    if (mark >= 70) return "B";
    if (mark >= 60) return "C";
    if (mark >= 50) return "D";
    if (mark >= 40) return "E";
    return "F";
  };

  const getValue = (studentId, baseField) => {
    const key = getField(baseField);
    const studentEdits = edits[studentId];
    const studentOriginal = students.find((s) => s.id === studentId);
    if (!studentOriginal) return "";
    return studentEdits && studentEdits[key] !== undefined ? studentEdits[key] : studentOriginal[key] || "";
  };

  const getYearCount = (year) => students.filter((s) => s.class && s.class.startsWith(year.toString())).length;

  // Ranking: use Grade Point Average (A best) + tie-breaker raw marks
  const getStudentRank = (studentId, studentClass) => {
    const student = students.find((s) => s.id === studentId);
    if (!student || !studentClass) return { classRank: "N/A", classTotal: 0, yearRank: "N/A", yearTotal: 0 };

    const termPrefix = `t${currentTerm}_`;
    const subjectKeys = ["subj_bm", "subj_english", "subj_math", "subj_science", "subj_sejarah", "subj_geografi"];

    const calculatePerformance = (s) => {
      let totalGradePoints = 0;
      let rawTotal = 0;
      let count = 0;

      subjectKeys.forEach((key) => {
        const mark = Number(s[termPrefix + key] || 0);
        rawTotal += mark;

        // A=1 (best) ... F=6 (worst)
        if (mark >= 80) totalGradePoints += 1;
        else if (mark >= 70) totalGradePoints += 2;
        else if (mark >= 60) totalGradePoints += 3;
        else if (mark >= 50) totalGradePoints += 4;
        else if (mark >= 40) totalGradePoints += 5;
        else totalGradePoints += 6;

        count++;
      });

      return {
        avgGP: count ? totalGradePoints / count : 999,
        totalScore: rawTotal,
      };
    };

    const myPerf = calculatePerformance(student);
    if (myPerf.totalScore === 0) return { classRank: "N/A", classTotal: 0, yearRank: "N/A", yearTotal: 0 };

    const rankSorter = (a, b) => {
      const perfA = calculatePerformance(a);
      const perfB = calculatePerformance(b);

      if (Math.abs(perfA.avgGP - perfB.avgGP) > 0.0001) return perfA.avgGP - perfB.avgGP; // lower better
      return perfB.totalScore - perfA.totalScore; // higher better
    };

    const classmates = students.filter((s) => s.class === studentClass);
    classmates.sort(rankSorter);
    const classRank = classmates.findIndex((s) => s.id === studentId) + 1;

    const yearPrefix = studentClass.toString().charAt(0);
    const yearmates = students.filter((s) => s.class && s.class.toString().startsWith(yearPrefix));
    yearmates.sort(rankSorter);
    const yearRank = yearmates.findIndex((s) => s.id === studentId) + 1;

    return { classRank, classTotal: classmates.length, yearRank, yearTotal: yearmates.length };
  };

  const handleEditChange = (id, field, value) => {
    const num = Number(value);

    // Attendance days validation
    if (field.includes("attendance_days")) {
      if (num < 0 || num > TOTAL_SCHOOL_DAYS) return;
    }
    // Co-cu days validation
    else if (field.includes("cocu_days")) {
      if (num < 0 || num > TOTAL_COCU_DAYS) return;
    }
    // Marks validation (0-100) — skip free text
    else if (!field.includes("signed") && !field.includes("strength") && !field.includes("weakness") && !field.includes("behavior")) {
      if (num < 0 || num > 100) return;
    }

    // If field already has t1_/t2_ prefix, keep it; else prefix with current term
    const dbKey = field.startsWith("t1_") || field.startsWith("t2_") ? field : getField(field);

    setEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], [dbKey]: value },
    }));
  };

  // --- ACTIONS ---
  async function handleSign(studentId) {
    if (!window.confirm(`Sign Term ${currentTerm} report electronically?`)) return;

    try {
      await update(ref(db, `students/${studentId}`), {
        [getField("signedBy")]: user?.name || user?.email || "Parent",
        [getField("signedAt")]: new Date().toISOString(),
      });
    } catch (e) {
      alert("Failed to sign.");
    }
  }

  async function handleUnsign(studentId) {
    if (!window.confirm("Are you sure you want to remove this signature?")) return;

    await update(ref(db, `students/${studentId}`), {
      [getField("signedBy")]: null,
      [getField("signedAt")]: null,
    });
  }

  async function handleSaveMain(id) {
    if (!edits[id]) return;
    await update(ref(db, `students/${id}`), edits[id]);
    const next = { ...edits };
    delete next[id];
    setEdits(next);
    alert("Saved successfully!");
  }

  async function handleSaveDetails() {
    if (!selectedStudent) return;

    const sEdits = edits[selectedStudent.id] || {};
    const original = students.find((st) => st.id === selectedStudent.id);

    const getVal = (key) => Number((sEdits[key] !== undefined ? sEdits[key] : original?.[key]) || 0);

    const newTotalScore =
      getVal(getField("subj_bm")) +
      getVal(getField("subj_english")) +
      getVal(getField("subj_math")) +
      getVal(getField("subj_science")) +
      getVal(getField("subj_sejarah")) +
      getVal(getField("subj_geografi"));

    await update(ref(db, `students/${selectedStudent.id}`), {
      ...sEdits,
      [getField("total_score")]: newTotalScore,
    });

    const next = { ...edits };
    delete next[selectedStudent.id];
    setEdits(next);
    setSelectedStudent(null);
    alert("Details saved!");
  }

  // --- CSV EXPORT TEMPLATE ---
  const downloadTemplate = () => {
    const headers = [
      "Student ID",
      "Name",
      "Term",
      "BM",
      "English",
      "Math",
      "Science",
      "Sejarah",
      "Geografi",
      "AttDays",
      "CocuDays",
    ];

    // Teacher -> only own class, Admin -> current filtered list
    const listForExport =
      user?.role === "teacher" ? students.filter((s) => s.class === user.class) : computedViewList;

    const rows = listForExport.map((s) => {
      const safeName = `"${String(s.name || "").replaceAll(`"`, `""`)}"`;
      // Force Excel treat ID as text
      const safeId = `"\t${s.id}"`;
      return [safeId, safeName, currentTerm, "", "", "", "", "", "", "", ""].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Marks_Template_Term${currentTerm}_${user?.class || "Report"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CSV IMPORT ---
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = String(event.target?.result || "");
      const rows = text
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean);

      let success = 0;
      let failed = 0;

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(",").map((c) => c.replace(/"/g, "").trim());
        // 0:ID, 1:Name, 2:Term, 3..8 marks, 9 att, 10 cocu
        const [rawId, _name, termRaw, bm, eng, math, sci, sej, geo, att, cocu] = cols;

        if (!rawId) continue;

        // remove the \t if any
        const id = rawId.replace(/^\t+/, "");

        const student = students.find((s) => s.id === id);
        if (!student) {
          failed++;
          continue;
        }
        if (user?.role === "teacher" && student.class !== user.class) {
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

  // --- COMPUTED LIST VIEW (role + admin filters + search) ---
  const computedViewList = useMemo(() => {
    if (!user) return [];

    let list =
      user.role === "parent"
        ? students.filter((s) => s.parentId === user.uid)
        : user.role === "teacher"
        ? students.filter((s) => s.class === user.class)
        : students;

    if (user.role === "admin") {
      if (selectedYear) list = list.filter((s) => s.class && s.class.startsWith(selectedYear));
      if (selectedClass) list = list.filter((s) => s.class === selectedClass);
    }

    const q = searchTerm.toLowerCase();
    if (q) {
      list = list.filter(
        (s) => (s.name || "").toLowerCase().includes(q) || (s.class || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [user, students, selectedYear, selectedClass, searchTerm]);

  const availableClasses = useMemo(() => {
    if (user?.role !== "admin") return [];
    const distinct = [...new Set(students.map((s) => s.class).filter(Boolean))].sort();
    return selectedYear ? distinct.filter((c) => c.startsWith(selectedYear)) : distinct;
  }, [user, students, selectedYear]);

  // --- RENDERING ---
  if (!user) return <div className="p-6">No user session.</div>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-indigo-600 font-bold animate-pulse">
        Loading Reports...
      </div>
    );
  }

  // 1) ADMIN DASHBOARD (only when admin + no selectedYear)
  if (user.role === "admin" && !selectedYear) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-r from-indigo-700 to-violet-700 -z-10 shadow-lg" />

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
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-10 -mt-10 group-hover:bg-indigo-100 transition-colors" />
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

  // 2) LIST VIEW
  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-r from-indigo-700 to-violet-700 -z-10 shadow-lg" />

      <div className="max-w-7xl mx-auto px-6 pt-12">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
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
                  currentTerm === term
                    ? "bg-white text-indigo-700 shadow-lg scale-105"
                    : "text-indigo-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                Term {term}
              </button>
            ))}
          </div>
        </div>

        {/* CONTROL BAR */}
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
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
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
                  {availableClasses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* TABLE */}
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
              {computedViewList.length > 0 ? (
                computedViewList.map((s) => {
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
      </div>

      {/* DETAILS MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/20 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 flex justify-between items-start relative shrink-0">
              <div className="absolute top-0 right-0 p-10 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Bahasa Melayu", key: "subj_bm", icon: "📖" },
                    { label: "Bahasa Inggeris", key: "subj_english", icon: "🔤" },
                    { label: "Matematik", key: "subj_math", icon: "📐" },
                    { label: "Sains", key: "subj_science", icon: "🧬" },
                    { label: "Pendidikan Islam/Moral", key: "subj_sejarah", icon: "🏛️" },
                    { label: "Geografi", key: "subj_geografi", icon: "🌍" },
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
                            className="w-full font-bold text-lg text-slate-800 bg-transparent outline-none p-0 border-b border-transparent focus:border-indigo-500 transition-colors"
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
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/20 transition-all" />
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
                          <div className="absolute top-0 right-0 p-8 bg-indigo-50 rounded-full -mr-4 -mt-4" />
                          <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-wide mb-1 relative z-10">
                            Year Position
                          </p>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
