import React, { useState, useEffect } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getDatabase, ref, onValue, remove, set, push } from 'firebase/database';
import { firebaseConfig } from '../firebaseConfig'; 
import { 
  Shield, UserPlus, Users, GraduationCap, Trash2, FileSpreadsheet, 
  Search, Mail, Lock, Briefcase, ChevronDown, CheckCircle, XCircle 
} from 'lucide-react';

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- CONSTANTS: STANDARD CLASS LIST ---
const FORMS = [1, 2, 3, 4, 5, 6];
const CLASS_NAMES = ["Amanah", "Bestari", "Cerdik", "Dedikasi", "Efisien"];
const CLASS_OPTIONS = FORMS.reduce((acc, form) => {
  acc[`Year ${form}`] = CLASS_NAMES.map(name => `${form} ${name}`);
  return acc;
}, {});

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [generatedCreds, setGeneratedCreds] = useState(null);
  
  const [activeTab, setActiveTab] = useState('users');
  const [importMode, setImportMode] = useState('family'); 
  const [csvFile, setCsvFile] = useState(null);

  // Forms
  const [newUser, setNewUser] = useState({ name: '', role: 'parent', className: '' });
  const [newStudent, setNewStudent] = useState({ name: '', className: '', parentId: '' });

  // 1. Fetch Data
  useEffect(() => {
    const unsubUsers = onValue(ref(db, 'users'), snap => 
      setUsers(snap.val() ? Object.entries(snap.val()).map(([uid, val]) => ({ uid, ...val })) : [])
    );
    const unsubStudents = onValue(ref(db, 'students'), snap => 
      setStudents(snap.val() ? Object.entries(snap.val()).map(([id, val]) => ({ id, ...val })) : [])
    );
    return () => { unsubUsers(); unsubStudents(); };
  }, []);

  const generatePassword = (len=8) => Math.random().toString(36).slice(-len);

  const generateEmail = (name) => {
    if (!name) return 'invalid@edulink.com';
    const clean = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, ''); 
    return `${clean}@edulink.com`;
  };

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  // --- ACTIONS ---
  async function handleAddUser(e) {
    e.preventDefault();
    setLoading(true); setStatus('Creating...'); setGeneratedCreds(null);
    
    const email = generateEmail(newUser.name);
    const password = generatePassword(8);
    const res = await createAccount(newUser.name, email, password, newUser.role, newUser.className);
    
    if (res) {
      setGeneratedCreds({ email, password });
      setNewUser({ name: '', role: 'parent', className: '' });
      setStatus('success');
    }
    setLoading(false);
  }

  async function handleAddStudent(e) {
    e.preventDefault();
    if (!newStudent.parentId) return setStatus("Error: Select a parent first.");
    if (!newStudent.className) return setStatus("Error: Select a class.");
    setLoading(true);
    try {
      await push(ref(db, 'students'), {
        name: newStudent.name, class: newStudent.className, parentId: newStudent.parentId,
        grade: 0, attendance: 100, lastUpdated: new Date().toISOString()
      });
      setStatus('success');
      setNewStudent({ name: '', className: '', parentId: '' });
    } catch (err) { setStatus(`Error: ${err.message}`); }
    setLoading(false);
  }

  async function createAccount(name, email, password, role, className = '') {
    const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
    const secondaryAuth = getAuth(secondaryApp);
    try {
      let cred;
      try {
        cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          const uniqueEmail = email.replace('@', `.${Math.floor(Math.random()*999)}@`);
          cred = await createUserWithEmailAndPassword(secondaryAuth, uniqueEmail, password);
        } else throw err;
      }
      
      const profile = { name, email: cred.user.email, role, createdAt: new Date().toISOString() };
      if (role === 'teacher' && className) profile.class = className;

      await set(ref(db, `users/${cred.user.uid}`), profile);
      await signOut(secondaryAuth);
      
      return { uid: cred.user.uid, email: cred.user.email, password };
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
      return null;
    } finally {
      await deleteApp(secondaryApp);
    }
  }

  // --- BULK IMPORT ---
  async function handleBulkImport() {
    if (!csvFile) return;
    setLoading(true);
    setStatus("Reading CSV...");
    
    const sessionParents = {}; 
    const newAccounts = [];
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const rows = e.target.result.split('\n').map(r => r.trim()).filter(r => r);
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',').map(s => s.trim());
        if (importMode === 'family') {
          const [pName, sName, sClass] = cols;
          if (!pName) continue;
          const pKey = pName.toLowerCase();
          let parentUid = sessionParents[pKey] || users.find(u => u.name.toLowerCase() === pKey && u.role === 'parent')?.uid;

          if (!parentUid) {
            const res = await createAccount(pName, generateEmail(pName), generatePassword(8), 'parent');
            if (res) {
              parentUid = res.uid;
              sessionParents[pKey] = parentUid;
              newAccounts.push({ ...res, name: pName, role: 'parent' });
              await delay(300);
            }
          }
          if (parentUid) {
            await push(ref(db, 'students'), { name: sName, class: sClass || 'Unassigned', parentId: parentUid, grade: 0, attendance: 100 });
          }
        } 
        else if (importMode === 'teacher') {
          const [tName, tClass] = cols;
          if (tName) {
            const res = await createAccount(tName, generateEmail(tName), generatePassword(8), 'teacher', tClass);
            if (res) { newAccounts.push({ ...res, name: tName, role: 'teacher', class: tClass||'' }); await delay(300); }
          }
        }
      }
      setLoading(false);
      setStatus("success");
      if (newAccounts.length > 0) downloadCredentials(newAccounts);
    };
    reader.readAsText(csvFile);
  }

  function downloadCredentials(accounts) {
    let csv = "Name,Email,Password,Role,Class\n" + accounts.map(a => `${a.name},${a.email},${a.password},${a.role},${a.class||''}`).join('\n');
    const link = document.createElement("a");
    link.href = encodeURI("data:text/csv;charset=utf-8," + csv);
    link.download = "edulink_credentials.csv";
    link.click();
  }

  const deleteUser = async (uid) => { if(confirm('Are you sure? This cannot be undone.')) await remove(ref(db, `users/${uid}`)); };
  const deleteStudent = async (id) => { if(confirm('Delete student record?')) await remove(ref(db, `students/${id}`)); };

  // --- STYLES ---
  const inputStyle = "w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 text-sm font-medium";
  const labelStyle = "block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 p-3 rounded-xl shadow-lg shadow-slate-200">
            <Shield className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Admin Portal</h1>
            <p className="text-slate-500 font-medium">Manage users, students, and system access</p>
          </div>
        </div>

        {/* TAB SWITCHER */}
        <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex">
          <button 
            onClick={() => setActiveTab('users')} 
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab==='users' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Users size={16} /> Manage Logins
          </button>
          <button 
            onClick={() => setActiveTab('students')} 
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab==='students' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <GraduationCap size={16} /> Manage Students
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        
        {/* LEFT COLUMN: FORMS */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* USER FORM */}
          {activeTab === 'users' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                <UserPlus className="text-blue-600" size={20} />
                <h2 className="text-xl font-bold text-slate-800">Create Account</h2>
              </div>
              
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className={labelStyle}>Full Name</label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
                    <input type="text" placeholder="e.g. John Tan" required className={inputStyle} value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className={labelStyle}>Role Assignment</label>
                  <div className="relative">
                    <Briefcase size={16} className="absolute left-3 top-3.5 text-slate-400" />
                    <select className={`${inputStyle} appearance-none cursor-pointer`} value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                      <option value="parent">Parent</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {newUser.role === 'teacher' && (
                  <div className="animate-fade-in">
                    <label className={labelStyle}>Assigned Class</label>
                    <div className="relative">
                      <GraduationCap size={16} className="absolute left-3 top-3.5 text-slate-400" />
                      <select className={`${inputStyle} appearance-none cursor-pointer`} value={newUser.className} onChange={e => setNewUser({...newUser, className: e.target.value})}>
                        <option value="">Select Class...</option>
                        {Object.entries(CLASS_OPTIONS).map(([form, classes]) => (
                          <optgroup key={form} label={form}>
                            {classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                          </optgroup>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition active:scale-[0.98] disabled:opacity-50">
                  {loading ? 'Processing...' : 'Create Account'}
                </button>
              </form>

              {generatedCreds && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-2">
                    <CheckCircle size={16} /> Account Created
                  </div>
                  <div className="text-xs space-y-1 text-emerald-800">
                    <p>Email: <span className="font-mono bg-white px-1 rounded">{generatedCreds.email}</span></p>
                    <p>Pass: <span className="font-mono bg-white px-1 rounded">{generatedCreds.password}</span></p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STUDENT FORM */}
          {activeTab === 'students' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                <GraduationCap className="text-emerald-600" size={20} />
                <h2 className="text-xl font-bold text-slate-800">Add Student</h2>
              </div>
              
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <label className={labelStyle}>Student Name</label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
                    <input type="text" placeholder="e.g. Ali bin Abu" required className={inputStyle} value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className={labelStyle}>Class</label>
                  <div className="relative">
                    <Briefcase size={16} className="absolute left-3 top-3.5 text-slate-400" />
                    <select className={`${inputStyle} appearance-none cursor-pointer`} value={newStudent.className} onChange={e => setNewStudent({...newStudent, className: e.target.value})}>
                      <option value="">Select Class...</option>
                      {Object.entries(CLASS_OPTIONS).map(([form, classes]) => (
                        <optgroup key={form} label={form}>
                          {classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                        </optgroup>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className={labelStyle}>Parent Link</label>
                  <div className="relative">
                    <Users size={16} className="absolute left-3 top-3.5 text-slate-400" />
                    <select className={`${inputStyle} appearance-none cursor-pointer`} value={newStudent.parentId} onChange={e => setNewStudent({...newStudent, parentId: e.target.value})}>
                      <option value="">Select Parent...</option>
                      {users.filter(u => u.role === 'parent').map(p => <option key={p.uid} value={p.uid}>{p.name}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <button disabled={loading} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition active:scale-[0.98] disabled:opacity-50">
                  Add Student Record
                </button>
              </form>
            </div>
          )}

          {/* BULK IMPORT */}
          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg text-white">
            <div className="flex items-center gap-2 mb-4">
              <FileSpreadsheet className="text-orange-400" size={20} />
              <h3 className="font-bold">Bulk Import Tool</h3>
            </div>
            
            <div className="flex gap-4 text-xs font-bold mb-4 bg-slate-700/50 p-1 rounded-lg">
              <label className={`flex-1 text-center py-2 rounded-md cursor-pointer transition ${importMode==='family'?'bg-orange-500 text-white':'text-slate-400 hover:text-white'}`}>
                <input type="radio" name="mode" className="hidden" checked={importMode==='family'} onChange={()=>setImportMode('family')} />
                Families
              </label>
              <label className={`flex-1 text-center py-2 rounded-md cursor-pointer transition ${importMode==='teacher'?'bg-orange-500 text-white':'text-slate-400 hover:text-white'}`}>
                <input type="radio" name="mode" className="hidden" checked={importMode==='teacher'} onChange={()=>setImportMode('teacher')} />
                Teachers
              </label>
            </div>
            
            <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files[0])} className="block w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600 mb-4 cursor-pointer"/>
            
            <button onClick={handleBulkImport} disabled={loading || !csvFile} className="w-full bg-white text-slate-900 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-100 disabled:opacity-50">
              Start CSV Import
            </button>
            {status === 'success' && <p className="text-xs text-emerald-400 mt-2 text-center">Operation Successful!</p>}
          </div>
        </div>

        {/* RIGHT COLUMN: LIST */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[600px]">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800">
              {activeTab === 'users' ? `System Users (${users.length})` : `Enrolled Students (${students.length})`}
            </h2>
            <div className="flex gap-2">
              <span className="h-3 w-3 rounded-full bg-red-400"></span>
              <span className="h-3 w-3 rounded-full bg-yellow-400"></span>
              <span className="h-3 w-3 rounded-full bg-green-400"></span>
            </div>
          </div>
          
          <ul className="flex-1 overflow-y-auto p-4 space-y-2">
            {activeTab === 'users' 
              ? users.map(u => (
                  <li key={u.uid} className="group flex justify-between items-center p-4 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                        u.role === 'teacher' ? 'bg-blue-100 text-blue-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{u.email} • <span className="uppercase">{u.role}</span> {u.class && `• ${u.class}`}</p>
                      </div>
                    </div>
                    <button onClick={()=>deleteUser(u.uid)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                      <Trash2 size={18} />
                    </button>
                  </li>
                ))
              : students.map(s => (
                  <li key={s.id} className="group flex justify-between items-center p-4 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.class} • Parent: {users.find(u=>u.uid===s.parentId)?.name || <span className="text-red-500">Unlinked</span>}</p>
                      </div>
                    </div>
                    <button onClick={()=>deleteStudent(s.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                      <Trash2 size={18} />
                    </button>
                  </li>
                ))
            }
          </ul>
        </div>

      </div>
    </div>
  );
}