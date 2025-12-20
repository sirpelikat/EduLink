import React, { useState, useEffect } from 'react';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { db, ref, update } from '../firebaseRTDB';
import { User, Lock, Shield, Mail, Briefcase, ChevronDown } from 'lucide-react'; // Added icons for visual polish

// --- CONSTANTS ---
const FORMS = [1, 2, 3, 4, 5];
const CLASS_NAMES = ["Amanah", "Bestari", "Cerdik", "Dedikasi", "Efisien"];
const CLASS_OPTIONS = FORMS.reduce((acc, form) => {
  acc[`Form ${form}`] = CLASS_NAMES.map(name => `${form} ${name}`);
  return acc;
}, {});

export default function Profile() {
  const { user, setUser } = useAuth();
  
  // State
  const [name, setName] = useState(user?.name || '');
  const [className, setClassName] = useState(user?.class || '');
  const [profileStatus, setProfileStatus] = useState('');
  
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passStatus, setPassStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const auth = getAuth();

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setClassName(user.class || '');
    }
  }, [user]);

  // --- HANDLERS ---
  async function handleUpdateProfile(e) {
    e.preventDefault();
    setLoading(true);
    setProfileStatus('Saving...');

    try {
      const updates = { name };
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
    if (newPass.length < 6) {
      setPassStatus("Error: Password must be 6+ chars.");
      return;
    }
    setLoading(true);
    setPassStatus("Verifying...");

    try {
      const currentUser = auth.currentUser;
      const credential = EmailAuthProvider.credential(currentUser.email, currentPass);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPass);
      
      setPassStatus("success");
      setCurrentPass('');
      setNewPass('');
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
    };
    return styles[role] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      
      {/* 1. HEADER CARD */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        {/* Decorative background blob */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="flex items-center gap-6 z-10">
          <div className="h-20 w-20 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl font-bold text-slate-400 shadow-inner">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">{user?.name}</h1>
            <div className="flex items-center gap-2 text-slate-500 mt-1 justify-center md:justify-start">
              <Mail size={14} />
              <span className="text-sm font-medium">{user?.email}</span>
            </div>
          </div>
        </div>
        
        <div className={`z-10 px-5 py-2 rounded-full border-2 text-sm font-extrabold uppercase tracking-widest shadow-sm ${getRoleBadge(user?.role)}`}>
          {user?.role} Portal
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        
        {/* 2. EDIT DETAILS CARD */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
            <User className="text-blue-600" size={20} />
            <h2 className="text-xl font-bold text-slate-800">Profile Details</h2>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="space-y-5 flex-1">
            
            {/* Read Only Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Role</label>
                <div className="relative">
                  <Shield size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input type="text" disabled value={user?.role?.toUpperCase() || ''} className={`${inputStyle} opacity-60 cursor-not-allowed uppercase`}/>
                </div>
              </div>
              <div>
                <label className={labelStyle}>Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input type="text" disabled value={user?.email || ''} className={`${inputStyle} opacity-60 cursor-not-allowed`}/>
                </div>
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className={labelStyle}>Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3.5 text-slate-400" />
                <input 
                  type="text" required 
                  value={name} onChange={e => setName(e.target.value)}
                  className={inputStyle}
                  placeholder="Your Full Name"
                />
              </div>
            </div>

            {/* Class Dropdown (Teachers Only) */}
            {user?.role === 'teacher' && (
              <div>
                <label className={labelStyle}>Assigned Class</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <select 
                    className={`${inputStyle} appearance-none cursor-pointer`}
                    value={className} 
                    onChange={e => setClassName(e.target.value)}
                  >
                    <option value="">Select a Class...</option>
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

            <div className="pt-2"></div>

            {/* Status Message */}
            {profileStatus && (
              <div className={`text-center text-sm font-semibold p-3 rounded-xl animate-fade-in ${
                profileStatus === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
              }`}>
                {profileStatus === 'success' ? '✅ Profile updated successfully!' : profileStatus}
              </div>
            )}

            <button 
              disabled={loading} 
              className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-xl hover:bg-slate-900 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* 3. SECURITY CARD */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 h-fit">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
            <Lock className="text-red-500" size={20} />
            <h2 className="text-xl font-bold text-slate-800">Security</h2>
          </div>
          
          <form onSubmit={handleChangePassword} className="space-y-5">
            <div>
              <label className={labelStyle}>Current Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
                <input 
                  type="password" required 
                  value={currentPass} onChange={e => setCurrentPass(e.target.value)}
                  className={inputStyle}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div>
              <label className={labelStyle}>New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
                <input 
                  type="password" required 
                  value={newPass} onChange={e => setNewPass(e.target.value)}
                  className={inputStyle}
                  placeholder="Min 6 characters"
                />
              </div>
            </div>

            <div className="pt-2"></div>

            {passStatus && (
              <div className={`text-center text-sm font-semibold p-3 rounded-xl animate-fade-in ${
                passStatus === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
              }`}>
                {passStatus === 'success' ? '✅ Password changed successfully!' : passStatus}
              </div>
            )}

            <button 
              disabled={loading} 
              className="w-full bg-rose-500 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-xl hover:bg-rose-600 hover:shadow-rose-200 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Update Password
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}