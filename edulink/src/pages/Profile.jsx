import React, { useState, useEffect } from 'react';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { db, ref, update } from '../firebaseRTDB';

export default function Profile() {
  const { user, setUser } = useAuth();
  
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

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setLoading(true);
    setProfileStatus('Saving...');

    try {
      const updates = { name };
      if (user.role === 'teacher') updates.class = className;

      const userRef = ref(db, `users/${user.uid}`);
      await update(userRef, updates);
      setUser({ ...user, ...updates });

      setProfileStatus('✅ Profile saved successfully!');
      setTimeout(() => setProfileStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setProfileStatus(`❌ Error: ${err.message}`);
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
      
      setPassStatus("✅ Password changed!");
      setCurrentPass('');
      setNewPass('');
    } catch (err) {
      if (err.code === 'auth/invalid-credential') {
        setPassStatus("❌ Incorrect current password.");
      } else {
        setPassStatus(`❌ Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  // Role Color Helper
  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'teacher': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'parent': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'student': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      
      {/* 1. HEADER CARD WITH ROLE BADGE */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-slate-200 rounded-full flex items-center justify-center text-2xl font-bold text-slate-500">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{user?.name}</h1>
            <p className="text-gray-500">{user?.email}</p>
          </div>
        </div>
        
        <div className={`px-4 py-2 rounded-full border text-sm font-bold uppercase tracking-wider shadow-sm ${getRoleBadgeColor(user?.role)}`}>
          {user?.role}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        
        {/* 2. EDIT DETAILS FORM */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-semibold mb-4 text-slate-700 border-b pb-2">Account Details</h2>
          
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                <input type="text" disabled value={user?.role?.toUpperCase() || ''} className="w-full border p-2 rounded bg-gray-50 text-gray-500 font-bold text-sm"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                <input type="text" disabled value={user?.email || ''} className="w-full border p-2 rounded bg-gray-50 text-gray-500 text-sm"/>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input 
                type="text" required 
                value={name} onChange={e => setName(e.target.value)}
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {user?.role === 'teacher' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Assigned Class</label>
                <input 
                  type="text" 
                  value={className} onChange={e => setClassName(e.target.value)}
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            )}

            <button disabled={loading} className="w-full bg-slate-800 text-white py-2 rounded hover:bg-slate-900 disabled:opacity-50 font-medium">
              Save Changes
            </button>

            {profileStatus && (
              <div className={`text-center text-sm p-2 rounded ${profileStatus.includes('Error') ? 'text-red-600 bg-red-50' : 'text-green-700 bg-green-50'}`}>
                {profileStatus}
              </div>
            )}
          </form>
        </div>

        {/* 3. CHANGE PASSWORD FORM */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-semibold mb-4 text-slate-700 border-b pb-2">Security</h2>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Password</label>
              <input 
                type="password" required 
                value={currentPass} onChange={e => setCurrentPass(e.target.value)}
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input 
                type="password" required 
                value={newPass} onChange={e => setNewPass(e.target.value)}
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button disabled={loading} className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50 font-medium">
              Update Password
            </button>

            {passStatus && (
              <div className={`text-center text-sm p-2 rounded ${passStatus.includes('Error') || passStatus.includes('Incorrect') ? 'text-red-600 bg-red-50' : 'text-green-700 bg-green-50'}`}>
                {passStatus}
              </div>
            )}
          </form>
        </div>

      </div>
    </div>
  );
}

