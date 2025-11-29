import React, { useState, useEffect } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getDatabase, ref, onValue, remove, set, push } from 'firebase/database';
import { firebaseConfig } from '../firebaseConfig'; 

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [generatedCreds, setGeneratedCreds] = useState(null);
  
  const [activeTab, setActiveTab] = useState('users');
  const [importMode, setImportMode] = useState('family'); 

  // Forms
  const [newUser, setNewUser] = useState({ name: '', role: 'parent', className: '' });
  const [newStudent, setNewStudent] = useState({ name: '', className: '', parentId: '' });
  const [csvFile, setCsvFile] = useState(null);

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

  // --- FIXED EMAIL GENERATOR ---
  const generateEmail = (name) => {
    if (!name) return 'invalid@edulink.com';
    const clean = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, ''); 
    return `${clean}@edulink.com`;
  };

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  // --- MANUAL: ADD USER ---
  async function handleAddUser(e) {
    e.preventDefault();
    setLoading(true); setStatus('Creating...'); setGeneratedCreds(null);
    
    const email = generateEmail(newUser.name);
    const password = generatePassword(8);
    const res = await createAccount(newUser.name, email, password, newUser.role, newUser.className);
    
    if (res) {
      setGeneratedCreds({ email, password });
      setNewUser({ name: '', role: 'parent', className: '' });
    }
    setLoading(false);
  }

  // --- MANUAL: ADD STUDENT ---
  async function handleAddStudent(e) {
    e.preventDefault();
    if (!newStudent.parentId) return setStatus("Select a parent first.");
    setLoading(true);
    try {
      await push(ref(db, 'students'), {
        name: newStudent.name, class: newStudent.className, parentId: newStudent.parentId,
        grade: 0, attendance: 100, lastUpdated: new Date().toISOString()
      });
      setStatus(`Success: ${newStudent.name} added.`);
      setNewStudent({ name: '', className: '', parentId: '' });
    } catch (err) { setStatus(err.message); }
    setLoading(false);
  }

  // --- HELPER: CREATE ACCOUNT ---
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
      
      setStatus(`Created: ${name}`);
      // Return full object including UID
      return { uid: cred.user.uid, email: cred.user.email, password };
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message} (${email})`);
      return null;
    } finally {
      await deleteApp(secondaryApp);
    }
  }

  // --- BULK IMPORT HANDLER (FIXED) ---
  async function handleBulkImport() {
    if (!csvFile) return;
    setLoading(true);
    setStatus("Reading CSV...");
    
    // CACHE: To remember parents created in this session
    const sessionParents = {}; // { "john tan": "uid_123" }
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
          
          // 1. Check Cache OR Existing Users
          let parentUid = sessionParents[pKey] || users.find(u => u.name.toLowerCase() === pKey && u.role === 'parent')?.uid;

          // 2. If not found, Create New Parent
          if (!parentUid) {
            const res = await createAccount(pName, generateEmail(pName), generatePassword(8), 'parent');
            if (res) {
              parentUid = res.uid; // Capture the new UID
              sessionParents[pKey] = parentUid; // Save to Cache
              newAccounts.push({ ...res, name: pName, role: 'parent' });
              await delay(300);
            }
          }

          // 3. Link Student to Parent UID
          if (parentUid) {
            setStatus(`Linking ${sName} to ${pName}...`);
            await push(ref(db, 'students'), {
              name: sName,
              class: sClass || 'Unassigned',
              parentId: parentUid, // Correctly Linked!
              grade: 0,
              attendance: 100
            });
          }
        } 
        else if (importMode === 'teacher') {
          const [tName, tClass] = cols;
          if (tName) {
            const res = await createAccount(tName, generateEmail(tName), generatePassword(8), 'teacher', tClass);
            if (res) {
              newAccounts.push({ ...res, name: tName, role: 'teacher', class: tClass||'' });
              await delay(300);
            }
          }
        }
      }
      setLoading(false);
      setStatus("Import Complete.");
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

  const deleteUser = async (uid) => { if(confirm('Delete?')) await remove(ref(db, `users/${uid}`)); };
  const deleteStudent = async (id) => { if(confirm('Delete?')) await remove(ref(db, `students/${id}`)); };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-slate-800">Admin Panel</h1>

      <div className="flex gap-4 mb-6 border-b">
        <button onClick={() => setActiveTab('users')} className={`pb-2 px-4 ${activeTab==='users'?'border-b-2 border-blue-600 font-bold':''}`}>Manage Logins</button>
        <button onClick={() => setActiveTab('students')} className={`pb-2 px-4 ${activeTab==='students'?'border-b-2 border-blue-600 font-bold':''}`}>Manage Students</button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          
          {/* USER FORM */}
          {activeTab === 'users' && (
            <div className="bg-white p-6 rounded shadow border">
              <h2 className="text-xl font-bold mb-4">Create Login</h2>
              <form onSubmit={handleAddUser} className="space-y-3">
                <input type="text" placeholder="Name" required className="w-full border p-2 rounded" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                <div className="flex gap-2">
                  <select className="w-full border p-2 rounded" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                    <option value="parent">Parent</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                  {newUser.role === 'teacher' && <input type="text" placeholder="Class" className="w-full border p-2 rounded" value={newUser.className} onChange={e => setNewUser({...newUser, className: e.target.value})} />}
                </div>
                <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50">Create User</button>
              </form>
              {generatedCreds && <div className="mt-3 p-3 bg-green-100 rounded text-sm">Created: <strong>{generatedCreds.email}</strong> / <strong>{generatedCreds.password}</strong></div>}
              {status && !generatedCreds && <p className="text-xs text-red-500 mt-2">{status}</p>}
            </div>
          )}

          {/* STUDENT FORM */}
          {activeTab === 'students' && (
            <div className="bg-white p-6 rounded shadow border">
              <h2 className="text-xl font-bold mb-4">Add Student Record</h2>
              <form onSubmit={handleAddStudent} className="space-y-3">
                <input type="text" placeholder="Student Name" required className="w-full border p-2 rounded" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                <input type="text" placeholder="Class" required className="w-full border p-2 rounded" value={newStudent.className} onChange={e => setNewStudent({...newStudent, className: e.target.value})} />
                <select className="w-full border p-2 rounded" value={newStudent.parentId} onChange={e => setNewStudent({...newStudent, parentId: e.target.value})}>
                  <option value="">-- Link Parent --</option>
                  {users.filter(u => u.role === 'parent').map(p => <option key={p.uid} value={p.uid}>{p.name}</option>)}
                </select>
                <button disabled={loading} className="w-full bg-emerald-600 text-white py-2 rounded disabled:opacity-50">Add Student</button>
              </form>
            </div>
          )}

          {/* BULK IMPORT */}
          <div className="bg-slate-50 border p-6 rounded shadow">
            <h3 className="font-bold mb-2">📂 Bulk Import Tool</h3>
            <div className="flex gap-4 text-sm mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="mode" checked={importMode==='family'} onChange={()=>setImportMode('family')} />
                Families
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="mode" checked={importMode==='teacher'} onChange={()=>setImportMode('teacher')} />
                Teachers
              </label>
            </div>
            <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files[0])} className="block w-full text-sm mb-3"/>
            <button onClick={handleBulkImport} disabled={loading || !csvFile} className="w-full bg-gray-800 text-white py-2 rounded text-sm">Start Import</button>
            <p className="text-xs text-center mt-2 text-gray-500">{status}</p>
          </div>
        </div>

        {/* LIST */}
        <div className="bg-white p-6 rounded shadow border h-full overflow-y-auto max-h-[600px]">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">
            {activeTab === 'users' ? `Logins (${users.length})` : `Students (${students.length})`}
          </h2>
          <ul className="divide-y">
            {activeTab === 'users' 
              ? users.map(u => (
                  <li key={u.uid} className="py-2 flex justify-between">
                    <div>
                      <p className="font-bold">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.role} • {u.email} {u.class && <span className="bg-yellow-100 px-1 rounded">{u.class}</span>}</p>
                    </div>
                    <button onClick={()=>deleteUser(u.uid)} className="text-red-500 text-xs">Delete</button>
                  </li>
                ))
              : students.map(s => (
                  <li key={s.id} className="py-2 flex justify-between">
                    <div>
                      <p className="font-bold">{s.name}</p>
                      <p className="text-xs text-gray-500">Class: {s.class} • Parent: {users.find(u=>u.uid===s.parentId)?.name || <span className="text-red-500">Unlinked</span>}</p>
                    </div>
                    <button onClick={async()=>{if(confirm('Del?')) await remove(ref(db,`students/${s.id}`))}} className="text-red-500 text-xs">Delete</button>
                  </li>
                ))
            }
          </ul>
        </div>
      </div>
    </div>
  );
}