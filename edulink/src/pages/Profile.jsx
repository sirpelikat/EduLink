import React, { useState, useEffect } from 'react';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { db, ref, update, onValue } from '../firebaseRTDB';
import { User, Lock, Shield, Mail, Briefcase, ChevronDown, GraduationCap, Clock, Phone } from 'lucide-react';

// --- CONSTANTS ---
const FORMS = [1, 2, 3, 4, 5, 6]; 
const CLASS_NAMES = ["Amanah", "Bestari", "Cerdik", "Dedikasi", "Efisien"];
const CLASS_OPTIONS = FORMS.reduce((acc, form) => {
  acc[`Year ${form}`] = CLASS_NAMES.map(name => `${form} ${name}`);
  return acc;
}, {});

export default function Profile() {
  const { user, setUser } = useAuth();
  
  // State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [className, setClassName] = useState(user?.class || '');
  const [profileStatus, setProfileStatus] = useState('');
  
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passStatus, setPassStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Parent Specific State
  const [myChildren, setMyChildren] = useState([]);

  const auth = getAuth();

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setClassName(user.class || '');

      // FETCH CHILDREN IF PARENT
      if (user.role === 'parent') {
        const unsub = onValue(ref(db, 'students'), (snapshot) => {
          const data = snapshot.val();
          const allStudents = data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [];
          const myKids = allStudents.filter(s => s.parentId === user.uid);
          setMyChildren(myKids);
        });
        return () => unsub();
      }
    }
  }, [user]);

  // --- HANDLERS ---
  async function handleUpdateProfile(e) {
    e.preventDefault();
    setLoading(true); setProfileStatus('Saving...');
    try {
      const updates = { name, phone }; 
      if (user.role === 'teacher') updates.class = className;
      
      await update(ref(db, `users/${user.uid}`), updates);
      setUser({ ...user, ...updates });
      
      setProfileStatus('success');
      setTimeout(() => setProfileStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setProfileStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPass.length < 6) { setPassStatus("Error: Password must be 6+ chars."); return; }
    setLoading(true); setPassStatus("Verifying...");
    try {
      const currentUser = auth.currentUser;
      const credential = EmailAuthProvider.credential(currentUser.email, currentPass);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPass);
      setPassStatus("success"); setCurrentPass(''); setNewPass('');
    } catch (err) {
      if (err.code === 'auth/invalid-credential') setPassStatus("Incorrect current password.");
      else setPassStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // --- STYLES ---
  const inputStyle = "w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-slate-700 font-medium";
  const labelStyle = "block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1";
  
  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-700 border-purple-200',
      teacher: 'bg-blue-100 text-blue-700 border-blue-200',
      parent: 'bg-amber-100 text-amber-700 border-amber-200',
      student: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      counselor: 'bg-pink-100 text-pink-700 border-pink-200'
    };
    return styles[role] || 'bg-gray-100 text-gray-700';
  };

  return (
    // Updated Main Container: Reduced padding on mobile (p-4) vs desktop (p-6)
    <div className="p-4 md:p-6 w-full mx-auto space-y-6 md:space-y-8 animate-fade-in">
      
      {/* 1. HEADER CARD */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        {/* Blob hidden on mobile to avoid visual clutter */}
        <div className="hidden md:block absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 z-10 w-full md:w-auto">
          {/* Responsive Avatar Size */}
          <div className="h-16 w-16 md:h-20 md:w-20 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-bold text-slate-400 shadow-inner">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="text-center md:text-left">
            {/* Responsive Text Size */}
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{user?.name}</h1>
            <div className="flex flex-col md:flex-row items-center gap-1 md:gap-4 mt-1">
                <div className="flex items-center gap-2 text-slate-500">
                    <Mail size={14} /> <span className="text-sm font-medium">{user?.email}</span>
                </div>
                {/* Display Phone if exists */}
                {user?.phone && (
                <div className="flex items-center gap-2 text-slate-500">
                    <Phone size={14} /> <span className="text-sm font-medium">{user?.phone}</span>
                </div>
                )}
            </div>
          </div>
        </div>
        {/* Badge spans full width on mobile */}
        <div className={`z-10 px-5 py-2 rounded-full border-2 text-xs md:text-sm font-extrabold uppercase tracking-widest shadow-sm w-full md:w-auto text-center ${getRoleBadge(user?.role)}`}>
          {user?.role} Portal
        </div>
      </div>

      <div className="grid gap-6 md:gap-8 md:grid-cols-2">
        
        {/* 2. EDIT DETAILS CARD */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4 md:mb-6 border-b border-slate-50 pb-4">
            <User className="text-blue-600" size={20} /> <h2 className="text-lg md:text-xl font-bold text-slate-800">Profile Details</h2>
          </div>
          <form onSubmit={handleUpdateProfile} className="space-y-4 md:space-y-5 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Role</label>
                <div className="relative">
                  <Shield size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input type="text" disabled value={user?.role?.toUpperCase() || ''} className={`${inputStyle} opacity-60 cursor-not-allowed uppercase text-xs md:text-sm`}/>
                </div>
              </div>
              <div>
                <label className={labelStyle}>Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input type="text" disabled value={user?.email || ''} className={`${inputStyle} opacity-60 cursor-not-allowed text-xs md:text-sm text-ellipsis overflow-hidden`}/>
                </div>
              </div>
            </div>

            {/* FULL NAME */}
            <div>
              <label className={labelStyle}>Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3.5 text-slate-400" />
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputStyle} placeholder="Your Full Name"/>
              </div>
            </div>

            {/* PHONE NUMBER FIELD */}
            <div>
              <label className={labelStyle}>Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-3.5 text-slate-400" />
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  className={inputStyle} 
                  placeholder="+60 12-345 6789"
                />
              </div>
            </div>

            {user?.role === 'teacher' && (
              <div>
                <label className={labelStyle}>Assigned Class</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <select className={`${inputStyle} appearance-none cursor-pointer`} value={className} onChange={e => setClassName(e.target.value)}>
                    <option value="">Select a Class...</option>
                    {Object.entries(CLASS_OPTIONS).map(([form, classes]) => (
                      <optgroup key={form} label={form}>{classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}</optgroup>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}
            <div className="pt-2"></div>
            {profileStatus && (
              <div className={`text-center text-sm font-semibold p-3 rounded-xl animate-fade-in ${profileStatus === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {profileStatus === 'success' ? 'Profile updated!' : profileStatus}
              </div>
            )}
            <button disabled={loading} className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-xl hover:bg-slate-900 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-auto">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* 3. SECURITY CARD */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 h-fit">
          <div className="flex items-center gap-2 mb-4 md:mb-6 border-b border-slate-50 pb-4">
            <Lock className="text-red-500" size={20} /> <h2 className="text-lg md:text-xl font-bold text-slate-800">Security</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4 md:space-y-5">
            <div>
              <label className={labelStyle}>Current Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
                <input type="password" required value={currentPass} onChange={e => setCurrentPass(e.target.value)} className={inputStyle} placeholder="••••••••"/>
              </div>
            </div>
            <div>
              <label className={labelStyle}>New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
                <input type="password" required value={newPass} onChange={e => setNewPass(e.target.value)} className={inputStyle} placeholder="Min 6 characters"/>
              </div>
            </div>
            <div className="pt-2"></div>
            {passStatus && (
              <div className={`text-center text-sm font-semibold p-3 rounded-xl animate-fade-in ${passStatus === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {passStatus === 'success' ? 'Password updated!' : passStatus}
              </div>
            )}
            <button disabled={loading} className="w-full bg-rose-500 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-xl hover:bg-rose-600 hover:shadow-rose-200 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              Update Password
            </button>
          </form>
        </div>
      </div>

      {/* 4. MY CHILDREN (PARENTS ONLY) */}
      {user?.role === 'parent' && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 animate-fade-in">
          <div className="flex items-center gap-2 mb-4 md:mb-6 border-b border-slate-50 pb-4">
            <GraduationCap className="text-amber-500" size={20} /> 
            <h2 className="text-lg md:text-xl font-bold text-slate-800">My Children</h2>
          </div>

          {myChildren.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myChildren.map((child) => (
                <div key={child.id} className="p-4 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all flex items-center gap-4 group cursor-pointer">
                  <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm shrink-0">
                    {child.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 group-hover:text-amber-700 transition-colors truncate">{child.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-semibold shrink-0">{child.class}</span>
                      <span className="flex items-center gap-1 text-emerald-600 font-bold shrink-0">
                        <Clock size={12}/> {child.attendance}% Att.
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 italic">
              No children linked to this account yet. Please contact Admin.
            </div>
          )}
        </div>
      )}
    </div>
  );
}